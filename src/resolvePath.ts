import { dirname, isAbsolute, resolve } from 'path';

export function defaultResolver ( importee:string, importer:string ) {
	// absolute paths are left untouched
	if ( isAbsolute( importee ) ) return importee;
	return resolve( dirname( importer ), importee ).replace( /\.js$/, '' ) + '.js';
}