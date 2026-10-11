export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      adiantamentos: {
        Row: {
          aprovado_por: string | null
          created_at: string
          empresa_id: string
          funcionario_id: string
          id: string
          motivo: string | null
          parcelas: number | null
          status: string | null
          updated_at: string
          valor: number
        }
        Insert: {
          aprovado_por?: string | null
          created_at?: string
          empresa_id: string
          funcionario_id: string
          id?: string
          motivo?: string | null
          parcelas?: number | null
          status?: string | null
          updated_at?: string
          valor: number
        }
        Update: {
          aprovado_por?: string | null
          created_at?: string
          empresa_id?: string
          funcionario_id?: string
          id?: string
          motivo?: string | null
          parcelas?: number | null
          status?: string | null
          updated_at?: string
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "adiantamentos_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "adiantamentos_funcionario_id_fkey"
            columns: ["funcionario_id"]
            isOneToOne: false
            referencedRelation: "funcionarios"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_ai_conversations: {
        Row: {
          access_blocked: boolean
          blocked_reason: string | null
          blocked_status: number | null
          id: string
          messages: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          access_blocked?: boolean
          blocked_reason?: string | null
          blocked_status?: number | null
          id?: string
          messages?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          access_blocked?: boolean
          blocked_reason?: string | null
          blocked_status?: number | null
          id?: string
          messages?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      agendamentos: {
        Row: {
          assunto: string | null
          cliente_id: string | null
          created_at: string
          duracao_min: number
          email: string | null
          id: string
          inicio: string
          nome_contato: string
          observacoes: string | null
          origem: string
          status: string
          telefone: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          assunto?: string | null
          cliente_id?: string | null
          created_at?: string
          duracao_min?: number
          email?: string | null
          id?: string
          inicio: string
          nome_contato: string
          observacoes?: string | null
          origem?: string
          status?: string
          telefone?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          assunto?: string | null
          cliente_id?: string | null
          created_at?: string
          duracao_min?: number
          email?: string | null
          id?: string
          inicio?: string
          nome_contato?: string
          observacoes?: string | null
          origem?: string
          status?: string
          telefone?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "agendamentos_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
        ]
      }
      anexos: {
        Row: {
          created_at: string
          empresa_id: string
          entidade_id: string
          entidade_tipo: string
          id: string
          mime_type: string | null
          nome: string
          storage_path: string
          tamanho_bytes: number | null
          uploaded_by: string | null
        }
        Insert: {
          created_at?: string
          empresa_id: string
          entidade_id: string
          entidade_tipo: string
          id?: string
          mime_type?: string | null
          nome: string
          storage_path: string
          tamanho_bytes?: number | null
          uploaded_by?: string | null
        }
        Update: {
          created_at?: string
          empresa_id?: string
          entidade_id?: string
          entidade_tipo?: string
          id?: string
          mime_type?: string | null
          nome?: string
          storage_path?: string
          tamanho_bytes?: number | null
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "anexos_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      apuracao_impostos: {
        Row: {
          competencia: string
          created_at: string
          empresa_id: string
          faturamento_bruto: number
          id: string
          regime_tributario: string
          status: string
          updated_at: string
          valor_cofins: number | null
          valor_csll: number | null
          valor_icms: number | null
          valor_irpj: number | null
          valor_iss: number | null
          valor_pis: number | null
          valor_simples: number | null
          valor_total_impostos: number | null
        }
        Insert: {
          competencia: string
          created_at?: string
          empresa_id: string
          faturamento_bruto?: number
          id?: string
          regime_tributario: string
          status?: string
          updated_at?: string
          valor_cofins?: number | null
          valor_csll?: number | null
          valor_icms?: number | null
          valor_irpj?: number | null
          valor_iss?: number | null
          valor_pis?: number | null
          valor_simples?: number | null
          valor_total_impostos?: number | null
        }
        Update: {
          competencia?: string
          created_at?: string
          empresa_id?: string
          faturamento_bruto?: number
          id?: string
          regime_tributario?: string
          status?: string
          updated_at?: string
          valor_cofins?: number | null
          valor_csll?: number | null
          valor_icms?: number | null
          valor_irpj?: number | null
          valor_iss?: number | null
          valor_pis?: number | null
          valor_simples?: number | null
          valor_total_impostos?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "apuracao_impostos_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      captacao_publica: {
        Row: {
          created_at: string
          email: string | null
          id: string
          mensagem: string | null
          nome: string
          origem: string | null
          processado: boolean
          telefone: string | null
          tipo_pessoa: string | null
        }
        Insert: {
          created_at?: string
          email?: string | null
          id?: string
          mensagem?: string | null
          nome: string
          origem?: string | null
          processado?: boolean
          telefone?: string | null
          tipo_pessoa?: string | null
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          mensagem?: string | null
          nome?: string
          origem?: string | null
          processado?: boolean
          telefone?: string | null
          tipo_pessoa?: string | null
        }
        Relationships: []
      }
      centros_custo: {
        Row: {
          ativo: boolean
          codigo: string
          created_at: string
          descricao: string | null
          empresa_id: string
          id: string
          nome: string
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          codigo: string
          created_at?: string
          descricao?: string | null
          empresa_id: string
          id?: string
          nome: string
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          codigo?: string
          created_at?: string
          descricao?: string | null
          empresa_id?: string
          id?: string
          nome?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "centros_custo_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      cliente_analise_versoes: {
        Row: {
          analise_id: string
          cliente_id: string
          conteudo: string
          created_at: string
          id: string
          revisado: boolean
          revisado_em: string | null
          revisado_por: string | null
          titulo: string
        }
        Insert: {
          analise_id: string
          cliente_id: string
          conteudo: string
          created_at?: string
          id?: string
          revisado: boolean
          revisado_em?: string | null
          revisado_por?: string | null
          titulo: string
        }
        Update: {
          analise_id?: string
          cliente_id?: string
          conteudo?: string
          created_at?: string
          id?: string
          revisado?: boolean
          revisado_em?: string | null
          revisado_por?: string | null
          titulo?: string
        }
        Relationships: [
          {
            foreignKeyName: "cliente_analise_versoes_analise_id_fkey"
            columns: ["analise_id"]
            isOneToOne: false
            referencedRelation: "cliente_analises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cliente_analise_versoes_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
        ]
      }
      cliente_analises: {
        Row: {
          cliente_id: string
          conteudo: string
          created_at: string
          id: string
          revisado: boolean
          revisado_em: string | null
          revisado_por: string | null
          tipo: string
          titulo: string
          updated_at: string
          user_id: string
        }
        Insert: {
          cliente_id: string
          conteudo: string
          created_at?: string
          id?: string
          revisado?: boolean
          revisado_em?: string | null
          revisado_por?: string | null
          tipo: string
          titulo: string
          updated_at?: string
          user_id: string
        }
        Update: {
          cliente_id?: string
          conteudo?: string
          created_at?: string
          id?: string
          revisado?: boolean
          revisado_em?: string | null
          revisado_por?: string | null
          tipo?: string
          titulo?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cliente_analises_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
        ]
      }
      cliente_anamnese: {
        Row: {
          cliente_id: string
          created_at: string
          id: string
          respostas: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          cliente_id: string
          created_at?: string
          id?: string
          respostas?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          cliente_id?: string
          created_at?: string
          id?: string
          respostas?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cliente_anamnese_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: true
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
        ]
      }
      cliente_eventos: {
        Row: {
          cliente_id: string
          created_at: string
          descricao: string | null
          entidade_id: string | null
          id: string
          ocorrido_em: string
          tipo: string
          titulo: string
          updated_at: string
          user_id: string
        }
        Insert: {
          cliente_id: string
          created_at?: string
          descricao?: string | null
          entidade_id?: string | null
          id?: string
          ocorrido_em?: string
          tipo: string
          titulo: string
          updated_at?: string
          user_id: string
        }
        Update: {
          cliente_id?: string
          created_at?: string
          descricao?: string | null
          entidade_id?: string | null
          id?: string
          ocorrido_em?: string
          tipo?: string
          titulo?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cliente_eventos_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
        ]
      }
      clientes: {
        Row: {
          arquivado: boolean
          cliente_user_id: string | null
          created_at: string
          documento: string | null
          email: string | null
          id: string
          nome: string
          observacoes: string | null
          responsavel_id: string | null
          telefone: string | null
          tipo_pessoa: Database["public"]["Enums"]["tipo_pessoa_enum"]
          updated_at: string
          user_id: string
        }
        Insert: {
          arquivado?: boolean
          cliente_user_id?: string | null
          created_at?: string
          documento?: string | null
          email?: string | null
          id?: string
          nome: string
          observacoes?: string | null
          responsavel_id?: string | null
          telefone?: string | null
          tipo_pessoa?: Database["public"]["Enums"]["tipo_pessoa_enum"]
          updated_at?: string
          user_id: string
        }
        Update: {
          arquivado?: boolean
          cliente_user_id?: string | null
          created_at?: string
          documento?: string | null
          email?: string | null
          id?: string
          nome?: string
          observacoes?: string | null
          responsavel_id?: string | null
          telefone?: string | null
          tipo_pessoa?: Database["public"]["Enums"]["tipo_pessoa_enum"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      comissoes: {
        Row: {
          base_calculo: number
          created_at: string
          data_pagamento: string | null
          empresa_id: string
          id: string
          observacoes: string | null
          pago: boolean
          pedido_id: string | null
          percentual: number
          updated_at: string
          valor: number
          vendedor_id: string
        }
        Insert: {
          base_calculo?: number
          created_at?: string
          data_pagamento?: string | null
          empresa_id: string
          id?: string
          observacoes?: string | null
          pago?: boolean
          pedido_id?: string | null
          percentual?: number
          updated_at?: string
          valor?: number
          vendedor_id: string
        }
        Update: {
          base_calculo?: number
          created_at?: string
          data_pagamento?: string | null
          empresa_id?: string
          id?: string
          observacoes?: string | null
          pago?: boolean
          pedido_id?: string | null
          percentual?: number
          updated_at?: string
          valor?: number
          vendedor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comissoes_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comissoes_pedido_id_fkey"
            columns: ["pedido_id"]
            isOneToOne: false
            referencedRelation: "pedidos_venda"
            referencedColumns: ["id"]
          },
        ]
      }
      company_settings: {
        Row: {
          cnpj: string | null
          created_at: string
          id: string
          name: string
          phone: string | null
          segment: string | null
          updated_at: string
        }
        Insert: {
          cnpj?: string | null
          created_at?: string
          id?: string
          name?: string
          phone?: string | null
          segment?: string | null
          updated_at?: string
        }
        Update: {
          cnpj?: string | null
          created_at?: string
          id?: string
          name?: string
          phone?: string | null
          segment?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      contas_bancarias: {
        Row: {
          agencia: string | null
          ativo: boolean
          banco: string
          conta: string | null
          created_at: string
          empresa_id: string
          id: string
          nome: string
          saldo_inicial: number
          tipo: string
          updated_at: string
        }
        Insert: {
          agencia?: string | null
          ativo?: boolean
          banco: string
          conta?: string | null
          created_at?: string
          empresa_id: string
          id?: string
          nome: string
          saldo_inicial?: number
          tipo?: string
          updated_at?: string
        }
        Update: {
          agencia?: string | null
          ativo?: boolean
          banco?: string
          conta?: string | null
          created_at?: string
          empresa_id?: string
          id?: string
          nome?: string
          saldo_inicial?: number
          tipo?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "contas_bancarias_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      contas_pagar: {
        Row: {
          categoria: string | null
          created_at: string
          created_by: string | null
          data_pagamento: string | null
          descricao: string | null
          empresa_id: string
          forma_pagamento: string | null
          fornecedor: string
          id: string
          pago: boolean | null
          updated_at: string
          valor: number
          vencimento: string
        }
        Insert: {
          categoria?: string | null
          created_at?: string
          created_by?: string | null
          data_pagamento?: string | null
          descricao?: string | null
          empresa_id: string
          forma_pagamento?: string | null
          fornecedor: string
          id?: string
          pago?: boolean | null
          updated_at?: string
          valor: number
          vencimento: string
        }
        Update: {
          categoria?: string | null
          created_at?: string
          created_by?: string | null
          data_pagamento?: string | null
          descricao?: string | null
          empresa_id?: string
          forma_pagamento?: string | null
          fornecedor?: string
          id?: string
          pago?: boolean | null
          updated_at?: string
          valor?: number
          vencimento?: string
        }
        Relationships: [
          {
            foreignKeyName: "contas_pagar_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      contas_receber: {
        Row: {
          cliente: string
          created_at: string
          created_by: string | null
          data_recebimento: string | null
          descricao: string | null
          empresa_id: string
          forma_pagamento: string | null
          id: string
          recebido: boolean | null
          updated_at: string
          valor: number
          vencimento: string
        }
        Insert: {
          cliente: string
          created_at?: string
          created_by?: string | null
          data_recebimento?: string | null
          descricao?: string | null
          empresa_id: string
          forma_pagamento?: string | null
          id?: string
          recebido?: boolean | null
          updated_at?: string
          valor: number
          vencimento: string
        }
        Update: {
          cliente?: string
          created_at?: string
          created_by?: string | null
          data_recebimento?: string | null
          descricao?: string | null
          empresa_id?: string
          forma_pagamento?: string | null
          id?: string
          recebido?: boolean | null
          updated_at?: string
          valor?: number
          vencimento?: string
        }
        Relationships: [
          {
            foreignKeyName: "contas_receber_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      contratos: {
        Row: {
          ativo: boolean
          cliente_id: string | null
          created_at: string
          data_fim: string | null
          data_inicio: string
          descricao: string
          dia_vencimento: number
          empresa_id: string
          id: string
          observacoes: string | null
          periodicidade: string
          proxima_cobranca: string
          updated_at: string
          valor: number
        }
        Insert: {
          ativo?: boolean
          cliente_id?: string | null
          created_at?: string
          data_fim?: string | null
          data_inicio?: string
          descricao: string
          dia_vencimento?: number
          empresa_id: string
          id?: string
          observacoes?: string | null
          periodicidade?: string
          proxima_cobranca?: string
          updated_at?: string
          valor?: number
        }
        Update: {
          ativo?: boolean
          cliente_id?: string | null
          created_at?: string
          data_fim?: string | null
          data_inicio?: string
          descricao?: string
          dia_vencimento?: number
          empresa_id?: string
          id?: string
          observacoes?: string | null
          periodicidade?: string
          proxima_cobranca?: string
          updated_at?: string
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "contratos_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contratos_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      empresas: {
        Row: {
          ativo: boolean
          cnpj: string | null
          created_at: string
          email: string | null
          endereco: string | null
          id: string
          nome: string
          regime_tributario: string | null
          segmento: string | null
          telefone: string | null
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          cnpj?: string | null
          created_at?: string
          email?: string | null
          endereco?: string | null
          id?: string
          nome: string
          regime_tributario?: string | null
          segmento?: string | null
          telefone?: string | null
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          cnpj?: string | null
          created_at?: string
          email?: string | null
          endereco?: string | null
          id?: string
          nome?: string
          regime_tributario?: string | null
          segmento?: string | null
          telefone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      equipe_membros: {
        Row: {
          ativo: boolean
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      estoque_movimentacoes: {
        Row: {
          created_at: string
          created_by: string | null
          custo_unitario: number
          data: string
          empresa_id: string
          id: string
          observacoes: string | null
          origem: string | null
          produto_id: string
          quantidade: number
          tipo: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          custo_unitario?: number
          data?: string
          empresa_id: string
          id?: string
          observacoes?: string | null
          origem?: string | null
          produto_id: string
          quantidade: number
          tipo: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          custo_unitario?: number
          data?: string
          empresa_id?: string
          id?: string
          observacoes?: string | null
          origem?: string | null
          produto_id?: string
          quantidade?: number
          tipo?: string
        }
        Relationships: [
          {
            foreignKeyName: "estoque_movimentacoes_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "estoque_movimentacoes_produto_id_fkey"
            columns: ["produto_id"]
            isOneToOne: false
            referencedRelation: "estoque_saldo"
            referencedColumns: ["produto_id"]
          },
          {
            foreignKeyName: "estoque_movimentacoes_produto_id_fkey"
            columns: ["produto_id"]
            isOneToOne: false
            referencedRelation: "produtos"
            referencedColumns: ["id"]
          },
        ]
      }
      extrato_bancario: {
        Row: {
          conciliado: boolean
          conciliado_com_id: string | null
          conciliado_com_tabela: string | null
          conciliado_em: string | null
          conta_bancaria_id: string
          created_at: string
          data: string
          descricao: string
          empresa_id: string
          fitid: string | null
          id: string
          memo: string | null
          origem: string
          saldo: number | null
          tipo: string
          valor: number
        }
        Insert: {
          conciliado?: boolean
          conciliado_com_id?: string | null
          conciliado_com_tabela?: string | null
          conciliado_em?: string | null
          conta_bancaria_id: string
          created_at?: string
          data: string
          descricao: string
          empresa_id: string
          fitid?: string | null
          id?: string
          memo?: string | null
          origem?: string
          saldo?: number | null
          tipo: string
          valor: number
        }
        Update: {
          conciliado?: boolean
          conciliado_com_id?: string | null
          conciliado_com_tabela?: string | null
          conciliado_em?: string | null
          conta_bancaria_id?: string
          created_at?: string
          data?: string
          descricao?: string
          empresa_id?: string
          fitid?: string | null
          id?: string
          memo?: string | null
          origem?: string
          saldo?: number | null
          tipo?: string
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "extrato_bancario_conta_bancaria_id_fkey"
            columns: ["conta_bancaria_id"]
            isOneToOne: false
            referencedRelation: "contas_bancarias"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "extrato_bancario_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      fluxo_caixa: {
        Row: {
          categoria: string | null
          created_at: string
          created_by: string | null
          data: string
          descricao: string
          empresa_id: string
          forma_pagamento: string | null
          id: string
          tipo: string
          valor: number
        }
        Insert: {
          categoria?: string | null
          created_at?: string
          created_by?: string | null
          data?: string
          descricao: string
          empresa_id: string
          forma_pagamento?: string | null
          id?: string
          tipo: string
          valor: number
        }
        Update: {
          categoria?: string | null
          created_at?: string
          created_by?: string | null
          data?: string
          descricao?: string
          empresa_id?: string
          forma_pagamento?: string | null
          id?: string
          tipo?: string
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "fluxo_caixa_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      fornecedores: {
        Row: {
          ativo: boolean
          cnpj_cpf: string | null
          condicao_pagamento: string | null
          created_at: string
          email: string | null
          empresa_id: string
          endereco: string | null
          id: string
          nome: string
          observacoes: string | null
          telefone: string | null
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          cnpj_cpf?: string | null
          condicao_pagamento?: string | null
          created_at?: string
          email?: string | null
          empresa_id: string
          endereco?: string | null
          id?: string
          nome: string
          observacoes?: string | null
          telefone?: string | null
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          cnpj_cpf?: string | null
          condicao_pagamento?: string | null
          created_at?: string
          email?: string | null
          empresa_id?: string
          endereco?: string | null
          id?: string
          nome?: string
          observacoes?: string | null
          telefone?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fornecedores_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      funcionarios: {
        Row: {
          admissao: string
          cargo: string
          created_at: string
          empresa_id: string
          id: string
          nome: string
          salario: number
          status: string | null
          telefone: string | null
          updated_at: string
        }
        Insert: {
          admissao: string
          cargo: string
          created_at?: string
          empresa_id: string
          id?: string
          nome: string
          salario: number
          status?: string | null
          telefone?: string | null
          updated_at?: string
        }
        Update: {
          admissao?: string
          cargo?: string
          created_at?: string
          empresa_id?: string
          id?: string
          nome?: string
          salario?: number
          status?: string | null
          telefone?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "funcionarios_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      lancamentos: {
        Row: {
          categoria: string | null
          cliente_id: string | null
          created_at: string
          data: string
          descricao: string
          forma_pagamento: string | null
          id: string
          observacoes: string | null
          parcela_atual: number | null
          parcelas_total: number | null
          planejado: boolean
          recorrente: boolean
          tipo: string
          updated_at: string
          user_id: string
          valor: number
        }
        Insert: {
          categoria?: string | null
          cliente_id?: string | null
          created_at?: string
          data: string
          descricao: string
          forma_pagamento?: string | null
          id?: string
          observacoes?: string | null
          parcela_atual?: number | null
          parcelas_total?: number | null
          planejado?: boolean
          recorrente?: boolean
          tipo: string
          updated_at?: string
          user_id: string
          valor: number
        }
        Update: {
          categoria?: string | null
          cliente_id?: string | null
          created_at?: string
          data?: string
          descricao?: string
          forma_pagamento?: string | null
          id?: string
          observacoes?: string | null
          parcela_atual?: number | null
          parcelas_total?: number | null
          planejado?: boolean
          recorrente?: boolean
          tipo?: string
          updated_at?: string
          user_id?: string
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "lancamentos_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          arquivado: boolean
          cliente_id: string | null
          created_at: string
          email: string | null
          etapa: string
          id: string
          nome: string
          observacoes: string | null
          origem: string | null
          proximo_contato: string | null
          status: string
          telefone: string | null
          tipo_pessoa: Database["public"]["Enums"]["tipo_pessoa_enum"] | null
          updated_at: string
          user_id: string
          valor_estimado: number | null
        }
        Insert: {
          arquivado?: boolean
          cliente_id?: string | null
          created_at?: string
          email?: string | null
          etapa?: string
          id?: string
          nome: string
          observacoes?: string | null
          origem?: string | null
          proximo_contato?: string | null
          status?: string
          telefone?: string | null
          tipo_pessoa?: Database["public"]["Enums"]["tipo_pessoa_enum"] | null
          updated_at?: string
          user_id: string
          valor_estimado?: number | null
        }
        Update: {
          arquivado?: boolean
          cliente_id?: string | null
          created_at?: string
          email?: string | null
          etapa?: string
          id?: string
          nome?: string
          observacoes?: string | null
          origem?: string | null
          proximo_contato?: string | null
          status?: string
          telefone?: string | null
          tipo_pessoa?: Database["public"]["Enums"]["tipo_pessoa_enum"] | null
          updated_at?: string
          user_id?: string
          valor_estimado?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "leads_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
        ]
      }
      leads_planilha: {
        Row: {
          created_at: string
          email: string
          id: string
          nome: string
          origem: string | null
          telefone: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          nome: string
          origem?: string | null
          telefone?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          nome?: string
          origem?: string | null
          telefone?: string | null
        }
        Relationships: []
      }
      metas: {
        Row: {
          categoria: string | null
          created_at: string
          empresa_id: string
          id: string
          mes: string
          observacoes: string | null
          tipo: string
          updated_at: string
          valor_previsto: number
          valor_realizado: number
        }
        Insert: {
          categoria?: string | null
          created_at?: string
          empresa_id: string
          id?: string
          mes: string
          observacoes?: string | null
          tipo?: string
          updated_at?: string
          valor_previsto?: number
          valor_realizado?: number
        }
        Update: {
          categoria?: string | null
          created_at?: string
          empresa_id?: string
          id?: string
          mes?: string
          observacoes?: string | null
          tipo?: string
          updated_at?: string
          valor_previsto?: number
          valor_realizado?: number
        }
        Relationships: [
          {
            foreignKeyName: "metas_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      notas_fiscais: {
        Row: {
          aliquota_cofins: number | null
          aliquota_csll: number | null
          aliquota_icms: number | null
          aliquota_irpj: number | null
          aliquota_iss: number | null
          aliquota_pis: number | null
          aliquota_simples: number | null
          base_calculo: number
          cliente_cnpj_cpf: string | null
          cliente_nome: string
          created_at: string
          created_by: string | null
          data_competencia: string
          data_emissao: string
          descricao: string
          empresa_id: string
          id: string
          natureza_operacao: string | null
          numero: string | null
          observacoes: string | null
          serie: string | null
          status: string
          tipo: string
          updated_at: string
          valor_cofins: number | null
          valor_csll: number | null
          valor_icms: number | null
          valor_irpj: number | null
          valor_iss: number | null
          valor_pis: number | null
          valor_simples: number | null
          valor_total: number
        }
        Insert: {
          aliquota_cofins?: number | null
          aliquota_csll?: number | null
          aliquota_icms?: number | null
          aliquota_irpj?: number | null
          aliquota_iss?: number | null
          aliquota_pis?: number | null
          aliquota_simples?: number | null
          base_calculo?: number
          cliente_cnpj_cpf?: string | null
          cliente_nome: string
          created_at?: string
          created_by?: string | null
          data_competencia?: string
          data_emissao?: string
          descricao: string
          empresa_id: string
          id?: string
          natureza_operacao?: string | null
          numero?: string | null
          observacoes?: string | null
          serie?: string | null
          status?: string
          tipo?: string
          updated_at?: string
          valor_cofins?: number | null
          valor_csll?: number | null
          valor_icms?: number | null
          valor_irpj?: number | null
          valor_iss?: number | null
          valor_pis?: number | null
          valor_simples?: number | null
          valor_total?: number
        }
        Update: {
          aliquota_cofins?: number | null
          aliquota_csll?: number | null
          aliquota_icms?: number | null
          aliquota_irpj?: number | null
          aliquota_iss?: number | null
          aliquota_pis?: number | null
          aliquota_simples?: number | null
          base_calculo?: number
          cliente_cnpj_cpf?: string | null
          cliente_nome?: string
          created_at?: string
          created_by?: string | null
          data_competencia?: string
          data_emissao?: string
          descricao?: string
          empresa_id?: string
          id?: string
          natureza_operacao?: string | null
          numero?: string | null
          observacoes?: string | null
          serie?: string | null
          status?: string
          tipo?: string
          updated_at?: string
          valor_cofins?: number | null
          valor_csll?: number | null
          valor_icms?: number | null
          valor_irpj?: number | null
          valor_iss?: number | null
          valor_pis?: number | null
          valor_simples?: number | null
          valor_total?: number
        }
        Relationships: [
          {
            foreignKeyName: "notas_fiscais_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      ordens_compra: {
        Row: {
          created_at: string
          data_emissao: string
          data_prevista: string | null
          empresa_id: string
          fornecedor_id: string | null
          id: string
          numero: number
          observacoes: string | null
          status: string
          updated_at: string
          valor_total: number
        }
        Insert: {
          created_at?: string
          data_emissao?: string
          data_prevista?: string | null
          empresa_id: string
          fornecedor_id?: string | null
          id?: string
          numero?: number
          observacoes?: string | null
          status?: string
          updated_at?: string
          valor_total?: number
        }
        Update: {
          created_at?: string
          data_emissao?: string
          data_prevista?: string | null
          empresa_id?: string
          fornecedor_id?: string | null
          id?: string
          numero?: number
          observacoes?: string | null
          status?: string
          updated_at?: string
          valor_total?: number
        }
        Relationships: [
          {
            foreignKeyName: "ordens_compra_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ordens_compra_fornecedor_id_fkey"
            columns: ["fornecedor_id"]
            isOneToOne: false
            referencedRelation: "fornecedores"
            referencedColumns: ["id"]
          },
        ]
      }
      ordens_compra_itens: {
        Row: {
          created_at: string
          descricao: string
          id: string
          ordem_id: string
          preco_unitario: number
          produto_id: string | null
          quantidade: number
          total: number
        }
        Insert: {
          created_at?: string
          descricao: string
          id?: string
          ordem_id: string
          preco_unitario?: number
          produto_id?: string | null
          quantidade?: number
          total?: number
        }
        Update: {
          created_at?: string
          descricao?: string
          id?: string
          ordem_id?: string
          preco_unitario?: number
          produto_id?: string | null
          quantidade?: number
          total?: number
        }
        Relationships: [
          {
            foreignKeyName: "ordens_compra_itens_ordem_id_fkey"
            columns: ["ordem_id"]
            isOneToOne: false
            referencedRelation: "ordens_compra"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ordens_compra_itens_produto_id_fkey"
            columns: ["produto_id"]
            isOneToOne: false
            referencedRelation: "estoque_saldo"
            referencedColumns: ["produto_id"]
          },
          {
            foreignKeyName: "ordens_compra_itens_produto_id_fkey"
            columns: ["produto_id"]
            isOneToOne: false
            referencedRelation: "produtos"
            referencedColumns: ["id"]
          },
        ]
      }
      ordens_servico: {
        Row: {
          cliente_id: string | null
          created_at: string
          data_conclusao: string | null
          descricao: string | null
          empresa_id: string
          id: string
          numero: number
          prazo: string | null
          prioridade: string
          status: string
          tecnico_id: string | null
          titulo: string
          updated_at: string
          valor: number
        }
        Insert: {
          cliente_id?: string | null
          created_at?: string
          data_conclusao?: string | null
          descricao?: string | null
          empresa_id: string
          id?: string
          numero?: number
          prazo?: string | null
          prioridade?: string
          status?: string
          tecnico_id?: string | null
          titulo: string
          updated_at?: string
          valor?: number
        }
        Update: {
          cliente_id?: string | null
          created_at?: string
          data_conclusao?: string | null
          descricao?: string | null
          empresa_id?: string
          id?: string
          numero?: number
          prazo?: string | null
          prioridade?: string
          status?: string
          tecnico_id?: string | null
          titulo?: string
          updated_at?: string
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "ordens_servico_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ordens_servico_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      pedidos_venda: {
        Row: {
          cliente_id: string | null
          created_at: string
          data_emissao: string
          data_entrega: string | null
          desconto: number
          empresa_id: string
          id: string
          numero: number
          observacoes: string | null
          status: string
          updated_at: string
          valor_bruto: number
          valor_total: number
          vendedor_id: string | null
        }
        Insert: {
          cliente_id?: string | null
          created_at?: string
          data_emissao?: string
          data_entrega?: string | null
          desconto?: number
          empresa_id: string
          id?: string
          numero?: number
          observacoes?: string | null
          status?: string
          updated_at?: string
          valor_bruto?: number
          valor_total?: number
          vendedor_id?: string | null
        }
        Update: {
          cliente_id?: string | null
          created_at?: string
          data_emissao?: string
          data_entrega?: string | null
          desconto?: number
          empresa_id?: string
          id?: string
          numero?: number
          observacoes?: string | null
          status?: string
          updated_at?: string
          valor_bruto?: number
          valor_total?: number
          vendedor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pedidos_venda_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pedidos_venda_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      pedidos_venda_itens: {
        Row: {
          created_at: string
          desconto: number
          descricao: string
          id: string
          pedido_id: string
          preco_unitario: number
          produto_id: string | null
          quantidade: number
          total: number
        }
        Insert: {
          created_at?: string
          desconto?: number
          descricao: string
          id?: string
          pedido_id: string
          preco_unitario?: number
          produto_id?: string | null
          quantidade?: number
          total?: number
        }
        Update: {
          created_at?: string
          desconto?: number
          descricao?: string
          id?: string
          pedido_id?: string
          preco_unitario?: number
          produto_id?: string | null
          quantidade?: number
          total?: number
        }
        Relationships: [
          {
            foreignKeyName: "pedidos_venda_itens_pedido_id_fkey"
            columns: ["pedido_id"]
            isOneToOne: false
            referencedRelation: "pedidos_venda"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pedidos_venda_itens_produto_id_fkey"
            columns: ["produto_id"]
            isOneToOne: false
            referencedRelation: "estoque_saldo"
            referencedColumns: ["produto_id"]
          },
          {
            foreignKeyName: "pedidos_venda_itens_produto_id_fkey"
            columns: ["produto_id"]
            isOneToOne: false
            referencedRelation: "produtos"
            referencedColumns: ["id"]
          },
        ]
      }
      pf_dividas: {
        Row: {
          created_at: string
          credor: string
          descricao: string | null
          id: string
          parcelas_pagas: number
          parcelas_total: number | null
          quitada: boolean
          taxa_juros_mensal: number | null
          updated_at: string
          user_id: string
          valor_pago: number
          valor_total: number
          vencimento: string | null
        }
        Insert: {
          created_at?: string
          credor: string
          descricao?: string | null
          id?: string
          parcelas_pagas?: number
          parcelas_total?: number | null
          quitada?: boolean
          taxa_juros_mensal?: number | null
          updated_at?: string
          user_id: string
          valor_pago?: number
          valor_total: number
          vencimento?: string | null
        }
        Update: {
          created_at?: string
          credor?: string
          descricao?: string | null
          id?: string
          parcelas_pagas?: number
          parcelas_total?: number | null
          quitada?: boolean
          taxa_juros_mensal?: number | null
          updated_at?: string
          user_id?: string
          valor_pago?: number
          valor_total?: number
          vencimento?: string | null
        }
        Relationships: []
      }
      pf_limites_categoria: {
        Row: {
          categoria: string
          created_at: string
          id: string
          limite_mensal: number
          updated_at: string
          user_id: string
        }
        Insert: {
          categoria: string
          created_at?: string
          id?: string
          limite_mensal: number
          updated_at?: string
          user_id: string
        }
        Update: {
          categoria?: string
          created_at?: string
          id?: string
          limite_mensal?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      pf_metas_pessoais: {
        Row: {
          categoria: string | null
          concluida: boolean
          created_at: string
          id: string
          prazo: string | null
          titulo: string
          updated_at: string
          user_id: string
          valor_alvo: number
          valor_atual: number
        }
        Insert: {
          categoria?: string | null
          concluida?: boolean
          created_at?: string
          id?: string
          prazo?: string | null
          titulo: string
          updated_at?: string
          user_id: string
          valor_alvo: number
          valor_atual?: number
        }
        Update: {
          categoria?: string | null
          concluida?: boolean
          created_at?: string
          id?: string
          prazo?: string | null
          titulo?: string
          updated_at?: string
          user_id?: string
          valor_alvo?: number
          valor_atual?: number
        }
        Relationships: []
      }
      pf_notas_mensais: {
        Row: {
          ano_mes: string
          created_at: string
          id: string
          nota: string
          updated_at: string
          user_id: string
        }
        Insert: {
          ano_mes: string
          created_at?: string
          id?: string
          nota: string
          updated_at?: string
          user_id: string
        }
        Update: {
          ano_mes?: string
          created_at?: string
          id?: string
          nota?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      pf_patrimonio: {
        Row: {
          created_at: string
          descricao: string
          id: string
          instituicao: string | null
          liquido: boolean
          observacoes: string | null
          tipo: Database["public"]["Enums"]["pf_patrimonio_tipo"]
          updated_at: string
          user_id: string
          valor_atual: number
        }
        Insert: {
          created_at?: string
          descricao: string
          id?: string
          instituicao?: string | null
          liquido?: boolean
          observacoes?: string | null
          tipo: Database["public"]["Enums"]["pf_patrimonio_tipo"]
          updated_at?: string
          user_id: string
          valor_atual: number
        }
        Update: {
          created_at?: string
          descricao?: string
          id?: string
          instituicao?: string | null
          liquido?: boolean
          observacoes?: string | null
          tipo?: Database["public"]["Enums"]["pf_patrimonio_tipo"]
          updated_at?: string
          user_id?: string
          valor_atual?: number
        }
        Relationships: []
      }
      pf_transacoes: {
        Row: {
          categoria: string
          created_at: string
          data: string
          descricao: string | null
          id: string
          parcela_atual: number | null
          parcelas_total: number | null
          recorrente: boolean
          tipo: Database["public"]["Enums"]["pf_transacao_tipo"]
          updated_at: string
          user_id: string
          valor: number
        }
        Insert: {
          categoria: string
          created_at?: string
          data?: string
          descricao?: string | null
          id?: string
          parcela_atual?: number | null
          parcelas_total?: number | null
          recorrente?: boolean
          tipo: Database["public"]["Enums"]["pf_transacao_tipo"]
          updated_at?: string
          user_id: string
          valor: number
        }
        Update: {
          categoria?: string
          created_at?: string
          data?: string
          descricao?: string | null
          id?: string
          parcela_atual?: number | null
          parcelas_total?: number | null
          recorrente?: boolean
          tipo?: Database["public"]["Enums"]["pf_transacao_tipo"]
          updated_at?: string
          user_id?: string
          valor?: number
        }
        Relationships: []
      }
      plano_contas: {
        Row: {
          ativo: boolean
          codigo: string
          created_at: string
          empresa_id: string
          grupo: string | null
          id: string
          nome: string
          parent_id: string | null
          tipo: string
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          codigo: string
          created_at?: string
          empresa_id: string
          grupo?: string | null
          id?: string
          nome: string
          parent_id?: string | null
          tipo: string
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          codigo?: string
          created_at?: string
          empresa_id?: string
          grupo?: string | null
          id?: string
          nome?: string
          parent_id?: string | null
          tipo?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "plano_contas_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "plano_contas_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "plano_contas"
            referencedColumns: ["id"]
          },
        ]
      }
      produtos: {
        Row: {
          ativo: boolean
          cfop: string | null
          created_at: string
          custo: number
          descricao: string | null
          empresa_id: string
          estoque_minimo: number
          id: string
          ncm: string | null
          nome: string
          preco_venda: number
          sku: string | null
          tipo: string
          unidade: string
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          cfop?: string | null
          created_at?: string
          custo?: number
          descricao?: string | null
          empresa_id: string
          estoque_minimo?: number
          id?: string
          ncm?: string | null
          nome: string
          preco_venda?: number
          sku?: string | null
          tipo?: string
          unidade?: string
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          cfop?: string | null
          created_at?: string
          custo?: number
          descricao?: string | null
          empresa_id?: string
          estoque_minimo?: number
          id?: string
          ncm?: string | null
          nome?: string
          preco_venda?: number
          sku?: string | null
          tipo?: string
          unidade?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "produtos_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          cpf: string | null
          created_at: string
          data_nascimento: string | null
          email: string | null
          full_name: string
          id: string
          objetivo_financeiro: string | null
          phone: string | null
          plano: string
          tipo_pessoa: Database["public"]["Enums"]["tipo_pessoa_enum"]
          trial_ends_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          cpf?: string | null
          created_at?: string
          data_nascimento?: string | null
          email?: string | null
          full_name?: string
          id?: string
          objetivo_financeiro?: string | null
          phone?: string | null
          plano?: string
          tipo_pessoa?: Database["public"]["Enums"]["tipo_pessoa_enum"]
          trial_ends_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          cpf?: string | null
          created_at?: string
          data_nascimento?: string | null
          email?: string | null
          full_name?: string
          id?: string
          objetivo_financeiro?: string | null
          phone?: string | null
          plano?: string
          tipo_pessoa?: Database["public"]["Enums"]["tipo_pessoa_enum"]
          trial_ends_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      reels_destaque: {
        Row: {
          ativo: boolean
          code: string
          created_at: string
          id: string
          ordem: number
          titulo: string
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          code: string
          created_at?: string
          id?: string
          ordem?: number
          titulo: string
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          code?: string
          created_at?: string
          id?: string
          ordem?: number
          titulo?: string
          updated_at?: string
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          cancel_at_period_end: boolean | null
          created_at: string | null
          current_period_end: string | null
          current_period_start: string | null
          environment: string
          id: string
          price_id: string
          product_id: string
          status: string
          stripe_customer_id: string
          stripe_subscription_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          cancel_at_period_end?: boolean | null
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          environment?: string
          id?: string
          price_id: string
          product_id: string
          status?: string
          stripe_customer_id: string
          stripe_subscription_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          cancel_at_period_end?: boolean | null
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          environment?: string
          id?: string
          price_id?: string
          product_id?: string
          status?: string
          stripe_customer_id?: string
          stripe_subscription_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      tarefas: {
        Row: {
          cliente_id: string | null
          concluida_em: string | null
          created_at: string
          descricao: string | null
          id: string
          prazo: string | null
          prioridade: string
          status: string
          titulo: string
          updated_at: string
          user_id: string
        }
        Insert: {
          cliente_id?: string | null
          concluida_em?: string | null
          created_at?: string
          descricao?: string | null
          id?: string
          prazo?: string | null
          prioridade?: string
          status?: string
          titulo: string
          updated_at?: string
          user_id: string
        }
        Update: {
          cliente_id?: string | null
          concluida_em?: string | null
          created_at?: string
          descricao?: string | null
          id?: string
          prazo?: string | null
          prioridade?: string
          status?: string
          titulo?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tarefas_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      usuario_empresas: {
        Row: {
          created_at: string
          empresa_id: string
          id: string
          papel: string
          user_id: string
        }
        Insert: {
          created_at?: string
          empresa_id: string
          id?: string
          papel?: string
          user_id: string
        }
        Update: {
          created_at?: string
          empresa_id?: string
          id?: string
          papel?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "usuario_empresas_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      estoque_saldo: {
        Row: {
          empresa_id: string | null
          estoque_minimo: number | null
          nome: string | null
          produto_id: string | null
          saldo: number | null
          sku: string | null
          unidade: string | null
        }
        Relationships: [
          {
            foreignKeyName: "produtos_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      can_download_signup_gifts: { Args: never; Returns: boolean }
      can_manage_cliente: {
        Args: { _cliente_id: string; _user_id: string }
        Returns: boolean
      }
      convert_lead_to_cliente: {
        Args: {
          _lead_id: string
          _tipo: Database["public"]["Enums"]["tipo_pessoa_enum"]
        }
        Returns: string
      }
      has_active_subscription: {
        Args: { check_env?: string; user_uuid: string }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      user_has_empresa_access: {
        Args: { _empresa_id: string; _user_id: string }
        Returns: boolean
      }
      workspace_access: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "user"
      pf_patrimonio_tipo:
        | "imovel"
        | "veiculo"
        | "investimento"
        | "conta"
        | "outro"
      pf_transacao_tipo: "receita" | "despesa"
      tipo_pessoa_enum: "PF" | "PJ"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "user"],
      pf_patrimonio_tipo: [
        "imovel",
        "veiculo",
        "investimento",
        "conta",
        "outro",
      ],
      pf_transacao_tipo: ["receita", "despesa"],
      tipo_pessoa_enum: ["PF", "PJ"],
    },
  },
} as const
