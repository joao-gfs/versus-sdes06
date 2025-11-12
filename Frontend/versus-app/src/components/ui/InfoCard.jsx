import * as React from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "./card";
import { Button } from "./button";

function InfoCard() {
  return (
    <Card className="max-w-xl">
      <CardHeader>
        <CardTitle>Sobre o Versus</CardTitle>
        <CardDescription>
          Aplicativo de criação, gestão e acompanhamento de torneios esportivos!
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          Versus é um projeto de cadastro, gestão, estatísticas e acompanhamento
          de torneios esportivos!.
        </p>

        <ul className="mt-4 space-y-2 text-sm list-inside list-disc text-versus-grey">
          <li>
            <strong>Tecnologias:</strong> React, Vite, TailwindCSS, Node.js,
            Prisma
          </li>
          <li>
            <strong>Funcionalidades:</strong> Login, rotas protegidas, CRUD de
            usuário
          </li>
          <li>
            <strong>Repo:</strong> Código disponível no GitHub (veja botão
            abaixo)
          </li>
        </ul>
      </CardContent>
      <CardFooter>
        <Button variant="outline" size="sm" asChild>
          <a
            href="https://github.com/joao-gfs/versus-sdes06"
            target="_blank"
            rel="noreferrer"
          >
            Ver repositório
          </a>
        </Button>
      </CardFooter>
    </Card>
  );
}

export default InfoCard;
