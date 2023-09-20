import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl as getPresignedUrl } from "@aws-sdk/s3-request-presigner";
import multer from "multer";
import multerS3 from "multer-s3";

const s3Client = new S3Client({ region: "ap-northeast-2" });

export async function getSignedUrl(key: string): Promise<string> {
  try {
    const command = new GetObjectCommand({ Bucket: "yeong-port", Key: key });
    const signedUrl = await getPresignedUrl(s3Client, command, {
      expiresIn: 60,
    });
    return signedUrl;
  } catch (error: any) {
    console.error("Error creating signed URL", error.message);
    throw new Error("Could not create signed URL: " + error.message);
  }
}

const upload = multer({
  storage: multerS3({
    s3: s3Client,
    bucket: "yeong-port",
    metadata: function (req, file, cb) {
      cb(null, { fieldName: file.fieldname });
    },
    key: function (req, file, cb) {
      cb(null, `${Date.now().toString()}-${file.originalname}`);
    },
  }),
}).single("profileImage");

export default upload;
