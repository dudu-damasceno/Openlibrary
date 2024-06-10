import requests
import psycopg2


class OpenLibraryAPI:
    BASE_URL = 'https://openlibrary.org'

    def __init__(self):
        pass

    def search_books(self, query, fields, limit):
        try:
            url = f"{self.BASE_URL}/search.json?q={query}&fields={fields}&limit={limit}"
            response = requests.get(url)
            response.raise_for_status()
            print('Informações de livros obtidas')
            return response.json()
        except requests.RequestException as e:
            print(f"Erro na requisição: {e}")
            return None


class DatabaseHandler:
    def __init__(self, dbname, user, password, host, port):
        try:
            self.conn = psycopg2.connect(
                dbname=dbname,
                user=user,
                password=password,
                host=host,
                port=port
            )
            self.cursor = self.conn.cursor()
        except psycopg2.Error as e:
            print(f"Erro ao conectar ao banco de dados: {e}")
            raise

    def insert_data(self, book, table_name, autor_table_name):
        if not isinstance(book, dict):
            print(f"Ignorando entrada inválida que não é um dicionário: {book}")
            return

        linguas = book.get('language', [])
        if not linguas:
            print("Pulando livro pois não possui linguagem.")
            return

        editora_name = book.get('publisher', '')
        if not editora_name:
            print("Pulando livro pois não possui editora.")
            return

        categorias = book.get('subject', [])
        if not categorias:
            print("Pulando livro pois não possui categoria.")
            return

        if isinstance(editora_name, list):
            editora_name = editora_name[0] if editora_name else None
        if editora_name:
            editora_name = editora_name.strip('{}"')
            if len(editora_name) > 500:
                print(f"Skipping book with editora_name longer than 500 characters: {editora_name[:50]}...")
                return

        livro_key = book.get('key', '').split('/')[-1]

        publish_year = book.get('publish_year')
        if isinstance(publish_year, list) and publish_year:
            ano_publicacao = int(publish_year[0])
        elif isinstance(publish_year, (int, str)):
            ano_publicacao = int(publish_year)
        else:
            ano_publicacao = None

        languages = book.get('language', [])
        if not isinstance(languages, list):
            languages = [languages]
        try:
            self.cursor.execute(f"""
                INSERT INTO {table_name} (livro_key, titulo, subtitulo, ano_publicacao, qtd_paginas, qtd_avaliacoes, capa_url)
                VALUES (%s, %s, %s, %s, %s, %s, %s)
                ON CONFLICT (livro_key) DO NOTHING
            """, (livro_key, book.get('title'), book.get('subtitle', ''), ano_publicacao, book.get('number_of_pages_median', 0), book.get('ratings_average', 0), f"https://covers.openlibrary.org/b/olid/{livro_key}-L.jpg"))

            for subject in categorias:
                subject = subject.strip()
                self.cursor.execute("""
                    SELECT categoria_id FROM categoria
                    WHERE nome = %s
                """, (subject,))
                categoria_id_row = self.cursor.fetchone()
                if categoria_id_row:
                    categoria_id = categoria_id_row[0]
                else:
                    self.cursor.execute("""
                        INSERT INTO categoria (nome)
                        VALUES (%s)
                        ON CONFLICT (nome) DO NOTHING
                        RETURNING categoria_id
                    """, (subject,))
                    self.conn.commit()
                    categoria_id_row = self.cursor.fetchone()
                    if categoria_id_row:
                        categoria_id = categoria_id_row[0]
                    else:
                        continue

                self.cursor.execute("""
                    INSERT INTO livro_categoria (livro_key, categoria_id)
                    VALUES (%s, %s)
                    ON CONFLICT (livro_key, categoria_id) DO NOTHING
                """, (livro_key, categoria_id))

            self.cursor.execute("""
                SELECT editora_id FROM editora
                WHERE nome = %s
            """, (editora_name,))
            editora_id_row = self.cursor.fetchone()
            if editora_id_row:
                editora_id = editora_id_row[0]
            else:
                self.cursor.execute("""
                    INSERT INTO editora (nome)
                    VALUES (%s)
                    ON CONFLICT (nome) DO NOTHING
                    RETURNING editora_id
                """, (editora_name,))
                self.conn.commit()
                editora_id_row = self.cursor.fetchone()
                if editora_id_row:
                    editora_id = editora_id_row[0]
                else:
                    return

            self.cursor.execute("""
                UPDATE livro
                SET editora_id = %s
                WHERE livro_key = %s
            """, (editora_id, livro_key))

            print('Inserindo autores....')
            author_keys = book.get('author_key', [])
            if not isinstance(author_keys, list):
                author_keys = [author_keys]

            for author_key in author_keys:
                if 'author_name' in book and isinstance(book['author_name'], list) and book['author_name']:
                    author_name = book['author_name'][0]
                elif 'author_name' in book and isinstance(book['author_name'], str):
                    author_name = book['author_name']
                else:
                    continue

                foto_url = f"https://covers.openlibrary.org/a/olid/{author_key}-L.jpg"

                self.cursor.execute("""
                    INSERT INTO autor (autor_key, nome, foto_url)
                    VALUES (%s, %s, %s)
                    ON CONFLICT (autor_key) DO NOTHING
                """, (author_key, author_name, foto_url))

                self.cursor.execute(f"""
                        INSERT INTO livro_autor (livro_key, autor_key)
                        VALUES (%s, %s)
                        ON CONFLICT (livro_key, autor_key) DO NOTHING
                    """, (livro_key, author_key))

            languages = book.get('language', [])
            if not isinstance(languages, list):
                languages = [languages]

            for language in languages:
                self.cursor.execute("""
                    SELECT lingua_id FROM lingua
                    WHERE sigla = %s
                """, (language,))
                lingua_id_row = self.cursor.fetchone()
                if lingua_id_row:
                    lingua_id = lingua_id_row[0]
                else:
                    self.cursor.execute("""
                        INSERT INTO lingua (sigla)
                        VALUES (%s)
                        ON CONFLICT (sigla) DO NOTHING
                        RETURNING lingua_id
                    """, (language,))
                    self.conn.commit()
                    lingua_id_row = self.cursor.fetchone()
                    if lingua_id_row:
                        lingua_id = lingua_id_row[0]
                    else:
                        continue

                self.cursor.execute("""
                    UPDATE livro
                    SET lingua_sigla = %s
                    WHERE livro_key = %s
                """, (language, livro_key))

            self.conn.commit()

        except psycopg2.Error as e:
            print(f"Erro ao inserir dados: {e}")
            self.conn.rollback()

    def __del__(self):
        if self.cursor:
            self.cursor.close()
        if self.conn:
            self.conn.close()


class BookProcessor:
    def __init__(self, api, db_handler):
        self.api = api
        self.db_handler = db_handler

    def filter_books_with_author_key(self, docs):
        return [doc for doc in docs if 'author_key' in doc]

    def process_books(self, query, fields, limit):
        data = self.api.search_books(query, fields, limit)
        if not data:
            return []

        docs = data.get('docs', [])
        filtered_books = self.filter_books_with_author_key(docs)

        for book in filtered_books:
            self.db_handler.insert_data(book, 'livro', 'livro_autor')

        print(f"Filtragem completa! {len(filtered_books)} livros encontrados com 'author_key'.")

        return filtered_books


def main():
    dbname = "openlibrary"
    user = "progra1"
    password = "123"
    host = "localhost"
    port = "5432"

    api = OpenLibraryAPI()
    db_handler = DatabaseHandler(dbname, user, password, host, port)
    book_processor = BookProcessor(api, db_handler)

    query = 'first_publish_year:[2000 TO 2023] AND edition_count:1'
    fields = 'publisher,language,author_key,author_name,title,subtitle,publish_year,number_of_pages_median,key,subject,ratings_average'
    limit = 10

    book_processor.process_books(query, fields, limit)

    del db_handler

if __name__ == "__main__":
    main()