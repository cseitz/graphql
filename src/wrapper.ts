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


//** Used in delayed computation of wrapped callbacks */
/*
class mutations extends ApolloResolverWrapper {
	static collection = {
		rename
	};
}; new mutations();

mutations.collection; // { rename: wrapped(rename) }
*/
export class ApolloResolverWrapper {
	[key: string]: any;
	constructor(resolverType?: string) {
		const groups = Object.getPrototypeOf(this).constructor;
		if (!resolverType) {
			const name = groups.name.toLowerCase();
			if (name.includes('mut')) {
				resolverType = 'Mutation'
			} else if (name.includes('que')) {
				resolverType = 'Query'
			} else if (name.includes('sub')) {
				resolverType = 'Subscription'
			} else {
				resolverType = ''
			}
		}
		for (const key in groups) {
			const resolvers = groups[key];
			const wrappedKey = '_' + key;
			Object.defineProperty(groups, key, {
				get() {
					if (wrappedKey in this) return this[wrappedKey];
					const _resolvers = { ...resolvers };
					for (const name in resolvers) {
						_resolvers[name] = ApolloCallbackWrapper(
							resolvers[name],
							_resolvers,
							resolverType as string
						)
					}
					this[wrappedKey] = _resolvers;
					return this[key];
				}
			})
		}
	}
}

