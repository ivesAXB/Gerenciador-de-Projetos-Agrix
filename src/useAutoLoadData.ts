import { useEffect } from 'react';
import { processExcelFile } from "@/lib/excelProcessor";
import { ClientData } from "@/types";

export const useAutoLoadData = (onLoad: (data: ClientData) => void) => {
  useEffect(() => {
    const carregarArquivos = async () => {
      // Nomes exatos que estão na sua pasta public/data/
      const listaArquivos = ['Pomar Agricola.xlsx', 'Fazenda Bodoquena.xlsx', 'Grupo Monte Cristo.xlsx'];

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