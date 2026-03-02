import { useEffect } from 'react';
import { processExcelFile } from "@/lib/excelProcessor";
import { ClientData } from "@/types";

export const useAutoLoadData = (onLoad: (data: ClientData) => void) => {
  useEffect(() => {
    const carregarArquivos = async () => {
      // Nomes exatos que estão na sua pasta public/data/
      const listaArquivos = ['12026-02-24T19_31_04.117Z LBRIT - Implantacao Agri X - Implantacao Ativa Projetos Em Andamento - Pomar Agricola.xlsx', '22026-02-24T19_29_48.528Z LBRIT - Implantacao Agri X - Implantacao Ativa Projetos Em Andamento - Fazenda Bodoquena.xlsx', '32026-02-24T19_29_14.758Z LBRIT - Implantacao Agri X - Implantacao Ativa Projetos Em Andamento - Grupo Monte Cristo (1).xlsx'];

      for (const nome of listaArquivos) {
        try {
          const response = await fetch(`${import.meta.env.BASE_URL}data/${nome}`);
          
          if (!response.ok) throw new Error(`Arquivo ${nome} não encontrado`);

          const blob = await response.blob();
          
          // Criamos um objeto "File" virtual para o seu processador entender
          const file = new File([blob], nome, { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
          
          // Usa a sua lógica existente para processar
          const data = await processExcelFile(file);
          
          // Envia para o Index.tsx
          onLoad(data);
          
        } catch (error) {
          console.error(`Erro na carga automática de ${nome}:`, error);
        }
      }
    };

    carregarArquivos();
  }, [onLoad]);
};