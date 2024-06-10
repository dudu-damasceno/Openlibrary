
CREATE TABLE autor(
    autor_key VARCHAR(11) PRIMARY KEY,
    nome VARCHAR(255), 
	foto_url VARCHAR(255), -- url usando author_key
	qtd_trabalhos INT -- trigger 
);

CREATE TABLE editora(
    editora_id SERIAL PRIMARY KEY, 
    nome VARCHAR(255) UNIQUE 
);



CREATE TABLE lingua(
    lingua_id SERIAL PRIMARY KEY, 
    sigla VARCHAR(3) UNIQUE 
);

CREATE TABLE categoria(
    categoria_id SERIAL PRIMARY KEY,
    nome VARCHAR(255) UNIQUE 
);

CREATE TABLE livro(
    livro_key VARCHAR(11) PRIMARY KEY, 
    titulo VARCHAR(255), 
	subtitulo VARCHAR(255),  
    ano_publicacao INT, 
    qtd_paginas INT, 
	qtd_avaliacoes INT, 
	capa_url VARCHAR(255),  
    editora_id INT,
	lingua_sigla VARCHAR(5),
	FOREIGN KEY (lingua_sigla) REFERENCES lingua(sigla),
	FOREIGN KEY(editora_id) REFERENCES editora(editora_id)
);

CREATE TABLE livro_autor(
    livro_key VARCHAR(11), 
    autor_key VARCHAR(11), 
    PRIMARY KEY (livro_key, autor_key),
	FOREIGN KEY(livro_key) REFERENCES livro(livro_key),
	FOREIGN KEY(autor_key) REFERENCES autor(autor_key)
);

CREATE TABLE livro_categoria(
    livro_key VARCHAR(11), 
    categoria_id INT,  
    PRIMARY KEY (livro_key, categoria_id),
	FOREIGN KEY(livro_key) REFERENCES livro(livro_key),
	FOREIGN KEY(categoria_id) REFERENCES categoria(categoria_id)
);


-- Criação da trigger para contar a quantidade de trabalhos (livros) de cada autor
CREATE OR REPLACE FUNCTION update_qtd_trabalhos()
RETURNS TRIGGER AS $$
BEGIN
-- Atualiza a quantidade de trabalhos do autor na tabela 'autor'
    UPDATE autor a
    SET qtd_trabalhos = (
        SELECT COUNT(*) 
        FROM livro_autor la
        WHERE la.autor_key = a.autor_key
    )
    WHERE a.autor_key = NEW.autor_key;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criação da trigger que será acionada após inserções na tabela 'livro_autor'
CREATE TRIGGER trig_update_qtd_trabalhos
AFTER INSERT ON livro_autor
FOR EACH ROW
EXECUTE FUNCTION update_qtd_trabalhos();

-- Criar a trigger para quando livro não possuir subtitulo
CREATE OR REPLACE FUNCTION before_insert_update_livro()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.subtitulo IS NULL OR NEW.subtitulo = '' THEN
        NEW.subtitulo = 'Não possui subtítulo';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Associar a trigger à tabela
CREATE TRIGGER before_insert_livro_trigger
BEFORE INSERT OR UPDATE ON livro
FOR EACH ROW
EXECUTE FUNCTION before_insert_update_livro();
