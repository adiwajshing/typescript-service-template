/**
 * this is more a stubs sort of file
 * since we're using any explicit authentication at the moment
 */

export type AuthUser = { }

export const authenticate = async(token: string): Promise<AuthUser> => {
	return { }
}

export const userCanAccess = ({ }: AuthUser, scopes: string[] | undefined) => {
	return true
}
