FROM public.ecr.aws/lambda/nodejs:18

# Copy function code
COPY src/package.json src/package-lock.json* /var/task/
RUN npm ci --only=production

COPY src/ /var/task/

# Command for Lambda
CMD [ "handler.handler" ]
