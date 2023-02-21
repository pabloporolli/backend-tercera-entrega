import autocannon from "autocannon";
import { PassThrough } from "stream";

// Las url que le pasamos son los endpoints
const run = (url) => {
  const buf = [];
  const outputStream = new PassThrough();

  // Fortmato
  const inst = autocannon({
    url,
    connections: 100,
    duration: 20,
  });

  // va estar haciendo simulaciones en tiempo real
  autocannon.track(inst, { outputStream });

  outputStream.on("data", (data) => {
    buf.push(data);
  });

  // Crea una grafica
  inst.on("done", () => {
    process.stdout.write(Buffer.concat(buf));
  });
};

console.log("Running all benchmarks...");
run("http://localhost:8080/info");
run("http://localhost:8080/info-bloq");