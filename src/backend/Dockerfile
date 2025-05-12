FROM golang:1.24-alpine AS builder

WORKDIR /app

RUN apk add --no-cache git

COPY go.mod go.sum ./

RUN go mod download

COPY . .

RUN CGO_ENABLED=0 GOOS=linux go build -o main .
RUN CGO_ENABLED=0 GOOS=linux go build -o scraper ./scraper/scraper.go

FROM alpine:3.21

WORKDIR /app

RUN apk --no-cache add ca-certificates

COPY --from=builder /app/main .
COPY --from=builder /app/scraper .

RUN mkdir -p /app/data /app/data/images

COPY --from=builder /app/data /app/data

EXPOSE 8080

ENV GIN_MODE=release 
ENV PORT=8080

CMD ["./main"]