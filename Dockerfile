# Dependencies stage
FROM oven/bun:1 AS dependencies

WORKDIR /usr/src/app

COPY package.json bun.lock ./

RUN bun install



# Builder stage
FROM oven/bun:1 AS builder

WORKDIR /usr/src/app

COPY --from=dependencies /usr/src/app/node_modules node_modules

COPY . .

RUN bun run build

#RUN bun ci -f --only=production && bun cache clean --force



# Final stage
FROM oven/bun:1 AS final

WORKDIR /usr/src/app

COPY --from=builder /usr/src/app/node_modules node_modules

COPY --from=builder /usr/src/app/dist dist

COPY --from=builder /usr/src/app/tsconfig.json tsconfig.json


USER bun

EXPOSE 4004
EXPOSE 8082

CMD ["bun", "dist/main.js"]

