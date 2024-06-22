--DBA
CREATE USER dbaopl WITH PASSWORD '123';
GRANT ALL PRIVILEGES ON DATABASE openlibrary TO dbaopl
GRANT USAGE ON SCHEMA public TO dbaopl

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

-- Confirmando se os privilégios foram sucedidos
SELECT * FROM pg_roles WHERE rolname = 'dbaopl';
SELECT * FROM information_schema.role_table_grants WHERE grantee='dbaopl';
	

--Programador 1
CREATE USER progra1 WITH PASSWORD '123';
GRANT INSERT, SELECT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO progra1;
GRANT USAGE ON ALL SEQUENCEs IN SCHEMA public TO progra1;
GRANT USAGE ON SCHEMA public TO progra1;

-- Confirmando se os privilégios foram sucedidos
SELECT * FROM pg_roles WHERE rolname = 'progra1';
SELECT * FROM information_schema.role_table_grants WHERE grantee='progra1';


--Programador 2
CREATE USER progra2 WITH PASSWORD '123';
GRANT SELECT ON ALL TABLES IN SCHEMA public TO progra2; 
GRANT USAGE ON ALL SEQUENCEs IN SCHEMA public TO progra2;
GRANT USAGE ON SCHEMA public TO progra2;

-- Confirmando se os privilégios foram sucedidos
SELECT * FROM pg_roles WHERE rolname = 'progra2';
SELECT * FROM information_schema.role_table_grants WHERE grantee='progra2';

--Aplicacao
CREATE USER app WITH PASSWORD '123';
GRANT SELECT ON ALL TABLES IN SCHEMA public TO app; 
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO app;
GRANT USAGE ON SCHEMA public TO app;


-- Confirmando se os privilégios foram sucedidos
SELECT * FROM pg_roles WHERE rolname = 'app';
SELECT * FROM information_schema.role_table_grants WHERE grantee='app';
