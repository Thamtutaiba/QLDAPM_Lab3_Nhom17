Lab03 - AWS Image Classification
Team: Nhóm 17 - QLDAPM Lab3  
Tech: AWS, React, Node.js, SAM, GitHub Actions

Ứng dụng phân loại hình ảnh sử dụng AWS Rekognition, cho phép upload ảnh và nhận diện các đối tượng trong ảnh.

 🚀 Demo

- Frontend: http://lab03-classifier-v2-web-941131937543-ap-southeast-1.s3-website-ap-southeast-1.amazonaws.com
- API: https://kw5nycqp9g.execute-api.ap-southeast-1.amazonaws.com/Prod

 Backend
- AWS Lambda - Serverless compute
- AWS Rekognition - AI image analysis
- AWS DynamoDB - NoSQL database
- AWS S3 - File storage
- AWS SAM - Infrastructure as Code
- Node.js 18 - Runtime

 Frontend
- React - UI framework
- Vite - Build tool
- AWS S3 - Static website hosting

 DevOps
- GitHub Actions - CI/CD pipeline
- AWS CloudFormation - Infrastructure deployment
- AWS CloudWatch - Monitoring & logging


Architecture
Frontend (S3) → API Gateway → Lambda → Rekognition
                     ↓
                DynamoDB (History)

Features
- Upload ảnh và phân loại tự động
- Lưu lịch sử phân loại
- API RESTful với CORS
- CI/CD tự động deploy

Environment Variables
- `VITE_API_BASE` - API endpoint URL
- `TABLE_NAME` - DynamoDB table name
- `BUCKET_NAME` - S3 bucket for uploads
- `ALLOWED_ORIGIN` - CORS origin

CI/CD Pipeline
GitHub Actions tự động:
1. Build & test backend (SAM)
2. Deploy to AWS
3. Build frontend
4. Sync to S3 website

 AWS Resources
- Lambda Function: Image processing
- DynamoDB Table: `RekognitionResultsV2`
- S3 Buckets: Uploads + Website hosting
- API Gateway: REST API
- CloudWatch: Logs & monitoring

API Endpoints
- `POST /classify` - Upload & analyze image
- `GET /history` - Get classification history
- `GET /hello` - Health check

Monitoring
- CloudWatch logs
- Error tracking
- Performance metrics

Team: Nhóm 17 - QLDAPM Lab3  
Tech: AWS, React, Node.js, SAM, GitHub Actions
