import { GraphQLResolveInfo } from 'graphql';
import { parseResolveInfo } from 'graphql-parse-resolve-info';

declare global {
	interface ApolloContext {
		[key: string]: any;
	}
}

export interface ApolloResolving {
	parent: any | undefined | null;
	context: ApolloContext;
	info: GraphQLResolveInfo;
	resolvers: any;
	resolverType: any;
	args: any;
	[key: string]: any;
}

export function ApolloCallbackWrapper(
	cb: Function, 
	resolvers: any, 
	resolverType: string
) {
	return function(
		parent?: ApolloResolving["parent"],
		args?: ApolloResolving["args"],
		context?: ApolloResolving["context"],
		info?: ApolloResolving["info"]
	) {
		const resolving: ApolloResolving = {
			parent,
			args,
			// @ts-ignore
			context,
			// @ts-ignore
			info,
			resolvers: resolvers[resolverType],
			resolverType,
			...(info ? parseResolveInfo(info) : {}),
		}
		if (context && info) {
            return cb(args, context, resolving)
        }
        return cb(parent, args, context, info)
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