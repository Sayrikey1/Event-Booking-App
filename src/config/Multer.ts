import multer, { Multer } from "multer";
import path from "path";

const timing: Date = new Date();

const formattedDate: number = timing.getUTCDate();
const formattedMonth: number = timing.getUTCMonth() + 1;
const formattedYear: number = timing.getUTCFullYear();
const formattedMinute: number = timing.getMinutes();
const formattedHour: number = timing.getHours();
const formattedSec: number = timing.getSeconds();
const formattedTime: string = `${formattedDate}-${formattedMonth}-${formattedYear}-${formattedHour}-${formattedMinute}-${formattedSec}`;

const directoryPath = `${path.join(__dirname, "..","Files","uploads").slice(1)}`;
const decodedpath = decodeURIComponent(directoryPath);

console.log(`decoded path: ${decodedpath}`);


const storage: multer.StorageEngine = multer.diskStorage({
  destination: function (
    req: Express.Request,
    file: Express.Multer.File,
    cb: (error: Error | null, destination: string) => void
  ): void {
    cb(null, decodedpath);

  },
  filename: function (
    req: Express.Request,
    file: Express.Multer.File,
    cb: (error: Error | null, filename: string) => void
  ): void {
    cb(null, `${formattedTime}-${file.originalname}`);
  },
});

const upload: Multer = multer({ storage: storage });



export default upload;
