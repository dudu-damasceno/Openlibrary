// backend/src/models/types.ts
export interface AutorDTO {
    autor_key: string;
    nome?: string;
    foto_url?: string;
    qtd_trabalhos?: number;
  }
  
  export interface CategoriaDTO {
    categoria_id: number;
    nome?: string;
  }
  
  export interface EditoraDTO {
    editora_id: number;
    nome?: string;
  }
  
  export interface LinguaDTO {
    lingua_id: number;
    sigla?: string;
  }
  
  export interface LivroDTO {
    livro_key: string;
    titulo?: string;
    subtitulo?: string;
    ano_publicacao?: number;
    qtd_paginas?: number;
    qtd_avaliacoes?: number;
    capa_url?: string;
    editora_id?: number;
    lingua_sigla?: string;
  }
  
  export interface LivroAutorDTO {
    livro_key: string;
    autor_key: string;
  }
  
  export interface LivroCategoriaDTO {
    livro_key: string;
    categoria_id: number;
  }
  