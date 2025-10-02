import { PrismaClient, ScopeType } from '@prisma/client';
import scopeReference from "../../src/reference/scope.reference";

const prisma = new PrismaClient();

export const seedSyncScope = async () => {
  const existingScopes = await prisma.scope.findMany({
    where: {
      id: {
        in: scopeReference.map((scope) => scope.id),
      },
    },
  });

  if (existingScopes.length > 0) return;

  const scopesWithTransformedType = scopeReference.map((scope) => ({
    ...scope,
    type: mapToScopeType(scope.type),
  }));

  const [scopeWithoutParent, scopeWithParent] =
    scopesWithTransformedType.reduce(
      (acc, scope) => {
        scope.hasOwnProperty('parentID')
          ? acc[1].push(scope)
          : acc[0].push(scope);
        return acc;
      },
      [[], []],
    );

  await prisma.scope.createMany({ data: scopeWithoutParent });
  await prisma.scope.createMany({ data: scopeWithParent });
};

function mapToScopeType(type: string): ScopeType {
  switch (type) {
    case 'PAGE':
      return ScopeType.PAGE;
    case 'FEATURE':
      return ScopeType.FEATURE;
    case 'ACTION':
      return ScopeType.ACTION;
    case 'WIDGET':
      return ScopeType.WIDGET;
    default:
      throw new Error(`Unknown scope type: ${type}`);
  }
}
