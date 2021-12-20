import { Connection, EntityManager, QueryRunner, ReplicationMode,getConnection } from 'typeorm'
import * as TE from 'fp-ts/TaskEither'
import * as F from 'fp-ts/function'
import * as E from 'fp-ts/Either'
import { IsolationLevel } from 'typeorm/driver/types/IsolationLevel'


interface TypeOrmFPTransaction<T = unknown> {
  connection: Connection,
  queryRunner: QueryRunner,
  result?: T
}



const startTransaction = <T>(level: IsolationLevel) => (fpTransaction: TypeOrmFPTransaction): TE.TaskEither<T,void> => TE.fromTask(() => fpTransaction.queryRunner.startTransaction(level));
const rollback = <T>(fpTransaction: TypeOrmFPTransaction):TE.TaskEither<T,void> => TE.fromTask(()=> fpTransaction.queryRunner.rollbackTransaction());
const commit = <T>(fpTransaction: TypeOrmFPTransaction):TE.TaskEither<T,void> => TE.fromTask(() => fpTransaction.queryRunner.commitTransaction());
const release = <T>(fpTransaction: TypeOrmFPTransaction):TE.TaskEither<T,void> => TE.fromTask(() => fpTransaction.queryRunner.release());

export const taskEitherOf = <T,E>(connection: Connection,mode?:ReplicationMode) => {
  return TE.of({
    connection,
    queryRunner: connection.createQueryRunner(mode)
  }) as TE.TaskEither<E, TypeOrmFPTransaction<T>>
}

export const of = <T>(connection: Connection, queryRunner: QueryRunner, result?: T) => ({
  connection,
  queryRunner,
  result
}) as TypeOrmFPTransaction<T>


export const start = <T,E>(level?: IsolationLevel) => 
  (fpTransaction: TE.TaskEither<E, TypeOrmFPTransaction<T>>) => {
    return F.pipe(
      fpTransaction,
      TE.chain(F.flow(
        startTransaction(level),
        TE.fromTask
      )),
      TE.chain(()=>fpTransaction)
    )
  }



export function transaction<T,R,E>(f: (manager:EntityManager,v?:T)=>TE.TaskEither<E,R>) {
  return (fpTransaction: TE.TaskEither<E, TypeOrmFPTransaction<T>>) => {
    return F.pipe(
      fpTransaction,
      TE.chain((v) => {
        return F.pipe(
          f(v.queryRunner.manager, v.result),
          TE.fold(
            (e) =>  F.pipe(
              rollback(v),
              TE.chain(()=>release(v)),
              TE.chain(() => TE.left(e))
            ),
            (result) => TE.of(
              of(v.connection, v.queryRunner, result)
            )
          )
        )
      }),
    )
  }
}

export const end = <T,E>(fpTransaction: TE.TaskEither<E, TypeOrmFPTransaction<T>>) => {
  return F.pipe(
    fpTransaction,
    TE.chainFirst(commit),
    TE.chainFirst(release)
  )
}


export const getResult = <T,E>(fpTransaction: TE.TaskEither<E, TypeOrmFPTransaction<T>>) =>
  F.pipe(
    fpTransaction,
    TE.map((v) => v.result)
  )
