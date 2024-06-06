select * from autor;
select * from categoria;
select * from editora;
select * from lingua;
select * from livro;
select * from livro_autor;
select * from livro_categoria;


drop table livro_categoria;
drop table livro_autor;
drop table livro;
drop table editora;
drop table lingua;
drop table categoria;
drop table autor;



CREATE TABLE autor(
    autor_key VARCHAR(11) PRIMARY KEY, --ok
    nome VARCHAR(255), -- ok
	foto_url VARCHAR(255), -- url usando author_key
	qtd_trabalhos INT -- trigger 
);

CREATE TABLE editora(
    editora_id SERIAL PRIMARY KEY, 
    nome VARCHAR(255) UNIQUE -- name 
);



CREATE TABLE lingua(
    lingua_id SERIAL PRIMARY KEY, 
    sigla VARCHAR(3) UNIQUE -- OK
);

CREATE TABLE categoria(
    categoria_id SERIAL PRIMARY KEY,
    nome VARCHAR(255) UNIQUE -- ok
);

CREATE TABLE livro(
    livro_key VARCHAR(11) PRIMARY KEY, -- ok
    titulo VARCHAR(255), -- ok 
	subtitulo VARCHAR(255), -- ok 
    ano_publicacao INT, -- ok 
    qtd_paginas INT, -- ok 
	qtd_avaliacoes INT, -- (preciso puxar)
	capa_url VARCHAR(255), -- url isbn 
    editora_id INT, -- fk,
	lingua_sigla VARCHAR(5),
	FOREIGN KEY (lingua_sigla) REFERENCES lingua(sigla),
	FOREIGN KEY(editora_id) REFERENCES editora(editora_id)
);

CREATE TABLE livro_autor(
    livro_key VARCHAR(11), -- ok 
    autor_key VARCHAR(11), -- ok 
    PRIMARY KEY (livro_key, autor_key),
	FOREIGN KEY(livro_key) REFERENCES livro(livro_key),
	FOREIGN KEY(autor_key) REFERENCES autor(autor_key)
);

CREATE TABLE livro_categoria(
    livro_key VARCHAR(11), -- ok 
    categoria_id INT, -- ok 
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


--------------------------------------------- users ----------------------------------------

--DBA
drop user dbaopl
Create User dbaopl with password '123';
Grant all privileges on database openlibrary to dbaopl
grant usage on schema public to dbaopl
-- Concede todos os privilégios no banco de dados
GRANT ALL PRIVILEGES ON DATABASE openlibrary TO dbaopl;

-- Concede privilégios específicos no banco de dados
GRANT CONNECT, TEMPORARY ON DATABASE openlibrary TO dbaopl;

-- Concede todos os privilégios no esquema
GRANT ALL PRIVILEGES ON SCHEMA public TO dbaopl;

-- Concede privilégios específicos no esquema
GRANT USAGE, CREATE ON SCHEMA public TO dbaopl;

-- Concede todos os privilégios na tabela
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO dbaopl;

-- Concede privilégios específicos na tabela
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO dbaopl;

-- Concede todos os privilégios na sequência
GRANT ALL PRIVILEGES ON ALL SEQUENCEs IN SCHEMA public TO dbaopl;

-- Concede privilégios específicos na sequência
GRANT USAGE, SELECT ON ALL SEQUENCEs IN SCHEMA public TO dbaopl;


SELECT * FROM pg_roles where rolname = 'dbaopl';
select * from information_schema.role_table_grants where grantee='dbaopl';
	

--Programador 1
Create User progra1 with password '123';
GRANT INSERT, SELECT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO progra1;
GRANT USAGE ON ALL SEQUENCEs IN SCHEMA public TO progra1;
grant usage on schema public to progra1;
SELECT * FROM pg_roles where rolname = 'progra1';
select * from information_schema.role_table_grants where grantee='progra1';


--Programador 2
Create User progra2 with password '123';
GRANT SELECT ON ALL TABLES IN SCHEMA public TO progra2; 
GRANT USAGE ON ALL SEQUENCEs IN SCHEMA public TO progra2;
grant usage on schema public to progra2;

SELECT * FROM pg_roles where rolname = 'progra2';
select * from information_schema.role_table_grants where grantee='progra2';

--Aplicacao
Create User app with password '123';
GRANT SELECT ON ALL TABLES IN SCHEMA public TO app; 
GRANT USAGE ON ALL SEQUENCEs IN SCHEMA public TO app;
grant usage on schema public to app;

SELECT * FROM pg_roles where rolname = 'app';
select * from information_schema.role_table_grants where grantee='app';




drop role progra1
REVOKE ALL PRIVILEGES ON autor FROM dbaopl;
REVOKE ALL PRIVILEGES ON editora FROM progra1;
REVOKE ALL PRIVILEGES ON lingua FROM progra1;
REVOKE ALL PRIVILEGES ON categoria FROM progra1;
REVOKE ALL PRIVILEGES ON livro FROM progra1;
REVOKE ALL PRIVILEGES ON livro_autor FROM progra1;
REVOKE ALL PRIVILEGES ON livro_categoria FROM progra1;

REVOKE ALL PRIVILEGES ON SCHEMA PUBLIC from programadoretapa1
