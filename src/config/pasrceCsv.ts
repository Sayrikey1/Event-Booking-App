import fs from "fs";
import { parse } from "csv-parse";

const CsvParser = (filePath: string): Promise<any[]> => {
  return new Promise((resolve, reject) => {
    const results: any[] = [];

    fs.createReadStream(filePath)
      .pipe(
        parse({
          comment: "#",
          columns: true,
        })
      )
      .on("data", (data: any) => {
        results.push(data);
      })
      .on("error", (err: any) => {
        console.error(err);
        reject(err);
      })
      .on("end", () => {
        console.log("Parsing complete");
        resolve(results);
      });

 
  });
};

export default CsvParser;
