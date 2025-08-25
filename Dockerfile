# Use a specific x86_64 nginx image
FROM nginx:1.25-alpine

# Copy the built React app
COPY dist/ /usr/share/nginx/html/

# Expose port 80
EXPOSE 80
