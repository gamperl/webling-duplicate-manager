// TODO: implement

	//
	// constructor() {
	// 	if (isFunction(getGlobalScope().addEventListener)) {
	// 		getGlobalScope().addEventListener(
	// 			'error',
	// 			(event: ErrorEvent): boolean => this.syntaxError(event)
	// 		);
	// 		getGlobalScope().addEventListener(
	// 			'unhandledrejection',
	// 			(event: any): void => this.onUnhandledRejection(event)
	// 		);
	// 	}
	// }
	//
	// private syntaxError(event: ErrorEvent): boolean {
	// 	const exception: IException = Exception.fromError(event.error || event);
	// 	const isPermissionDeniedError: boolean = [
	// 		'Permission denied', 'Erlaubnis verweigert.', 'Zugriff verweigert', 'Script error.', 'Accès refusé.'
	// 	].indexOf(String(exception.message)) > -1;
	// 	ExceptionReporter.send({
	// 		...exception,
	// 		tag: isPermissionDeniedError ? ExceptionTag.PERMISSION_DENIED : ExceptionTag.SYNTAX
	// 	});
	// 	return false;
	// }
	//
	// private onUnhandledRejection(event: { reason: any; detail: any; preventDefault(): void }): void {
	// 	const exception: IException = Exception.fromError(this.extractExceptionFromEvent(event));
	//
	// 	// if the rejection is a faild hot code reload, ignore the rejection
	// 	if (process.env.NODE_ENV !== 'production') {
	// 		if (
	// 			exception.message.substr(0, 'Aborted because'.length) === 'Aborted because' &&
	// 			typeof exception.stack === 'string' &&
	// 			/:8787\/dist\/runtime\.js:\d+:\d+$/.test(exception.stack)
	// 		) {
	// 			return;
	// 		}
	// 	}
	//
	// 	// prevent console output
	// 	event.preventDefault();
	//
	// 	ExceptionReporter.send({
	// 		...exception,
	// 		tag: ExceptionTag.UNHANDLED_REJECTION
	// 	});
	// }
