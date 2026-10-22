FROM python:3.13.9-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY app.py .
USER 10001:10001
EXPOSE 8000
CMD ["python", "-u", "app.py"]
