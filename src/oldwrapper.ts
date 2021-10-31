// Resolver/Mutation Wrapper

import { parseResolveInfo } from 'graphql-parse-resolve-info';

export interface ApolloResolving {
    parent?: any;
    context?: any;
    info?: any;
    args?: any;
}

export function ApolloCallbackWrapper(cb: Function, resolvers: any, resolverType: string) {
    return function(
        parent?: ApolloResolving["parent"],
        args?: ApolloResolving["args"],
        context?: ApolloResolving["context"],
        info?: ApolloResolving["info"]
    ) {
        const self: ApolloResolving = {
            parent,
            args,
            context,
            info,
            // @ts-ignore
            resolvers: resolvers[resolverType],
            resolverType,
            ...(info ? parseResolveInfo(info) : {}),
        }
        if (context && info) {
            return cb.call(self, args);
        }
        return cb.call(self, parent, args, context, info)
    }
}

export function WrapApolloResolvers(resolvers: any) {
    for (const resolverType in resolvers) {
        const resolvers_ = resolvers[resolverType];
        if (Object.keys(resolvers_).length == 0) {
            delete resolvers[resolverType];
        } else {

            resolvers[resolverType] = Object.fromEntries(
                Object.entries(resolvers_).map(([key, value]: [string, any]) => {
                    return [key, ApolloCallbackWrapper(value, resolvers, resolverType)]
                })
            )
        }
    }

    return resolvers;
}