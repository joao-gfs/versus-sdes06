import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import InfoCard from "../components/ui/InfoCard";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "../components/ui/card";
import { Button } from "../components/ui/button";

function HomePage() {
  const { user, hasAnyRole } = useAuth();
  const navigate = useNavigate();

  return (
    <>
      <h1 className="text-3xl text-versus-yellow font-bold mb-4">
        Bem-vindo, {user?.nome || 'Usuário'}!
      </h1>
      <p className="text-lg text-muted-foreground mb-6">
        Sistema de gestão de torneios esportivos
      </p>

      <InfoCard/>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
        
        
        {/* Card de Criação de Usuários - apenas para ADM e ORG */}
        {hasAnyRole(['ADM', 'ORG']) && (
          <Card className="max-w-xl">
            <CardHeader>
              <CardTitle>Gerenciar Usuários</CardTitle>
              <CardDescription>
                Criar e gerenciar usuários do sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Crie novos usuários e atribua papéis e permissões de acordo com as 
                necessidades da sua organização.
              </p>
            </CardContent>
            <CardFooter className="flex gap-2">
              {hasAnyRole(['ADM']) && (
                <Button 
                  variant="default" 
                  size="sm"
                  onClick={() => navigate('/usuarios')}
                >
                  Gerenciar Usuários
                </Button>
              )}
            </CardFooter>
          </Card>
        )}

        {/* Card de Organizações - apenas para ADM */}
        {hasAnyRole(['ADM']) && (
          <Card className="max-w-xl">
            <CardHeader>
              <CardTitle>Gerenciar Organizações</CardTitle>
              <CardDescription>
                Criar e gerenciar organizações esportivas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Gerencie federações, associações e clubes-matriz. Cada torneio e time 
                deve estar vinculado a uma organização.
              </p>

            </CardContent>
            <CardFooter>
              <Button 
                variant="default" 
                size="sm"
                onClick={() => navigate('/organizacoes')}
              >
                Gerenciar Organizações
              </Button>
            </CardFooter>
          </Card>
        )}
      </div>
    </>
  );
}

export default HomePage