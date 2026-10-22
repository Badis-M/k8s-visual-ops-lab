FROM python:3.13.7-alpine
ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1
WORKDIR /app
COPY server.py /app/server.py
USER 10001:10001
EXPOSE 8443
CMD ["python", "/app/server.py"]
