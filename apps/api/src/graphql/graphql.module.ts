import { Module } from '@nestjs/common';
import { GraphQLModule as NestGraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { join } from 'path';
import { PetitionsModule } from '../petitions/petitions.module';
import { PetitionsResolver } from './petitions.resolver';

@Module({
  imports: [
    PetitionsModule,
    NestGraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: join(process.cwd(), 'src/graphql/schema.gql'),
      sortSchema: true,
      playground: process.env.NODE_ENV !== 'production',
      introspection: true,
      path: '/graphql',
    }),
  ],
  providers: [PetitionsResolver],
})
export class ChangeLiberiaGraphQLModule {}
