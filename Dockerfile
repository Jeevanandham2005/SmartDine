FROM node:18-slim
RUN apt-get update || : && apt-get install -y python3 python3-pip
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN pip3 install -r requirements.txt --break-system-packages
EXPOSE 5000
CMD ["node", "server.js"]