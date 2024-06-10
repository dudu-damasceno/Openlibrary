--Index para chave estrangeira editora na tabela livro
EXPLAIN ANALYSE SELECT * FROM livro l JOIN editora e on l.editora_id= e.editora_id;
CREATE INDEX livro_editora_id ON livro USING btree(editora_id);

--Index para o atributo ano_publicacao em livro
EXPLAIN ANALYSE SELECT * FROM livro WHERE ano_publicacao > 2005 and ano_publicacao < 2007;
CREATE INDEX livro_ano ON livro USING btree(ano_publicacao)

--Index para o atributo qtd_trabalhos em autor
EXPLAIN ANALYSE SELECT * FROM autor WHERE qtd_trabalhos > 20
CREATE INDEX autor_qtd_trabalhos ON autor USING btree(qtd_trabalhos)
