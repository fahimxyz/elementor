import ComponentBase from 'elementor-api/modules/component-base';
import Document from './document';
import * as commands from './commands/';

export default class Component extends ComponentBase {
	__construct( args = {} ) {
		super.__construct( args );

		/**
		 * Auto save timer handlers.
		 *
		 * @type {Object}
		 */
		this.autoSaveTimers = {};

		/**
		 * Auto save interval.
		 *
		 * @type {number}
		 */
		this.autoSaveInterval = elementor.config.autosave_interval * 1000;

		/**
		 * All the documents.
		 *
		 * @type {Object.<Document>}
		 */
		this.documents = {};

		/**
		 * Current document.
		 *
		 * @type {Document}
		 */
		this.currentDocument = null;
	}

	getNamespace() {
		return 'editor/documents';
	}

	defaultCommands() {
		return this.importCommands( commands );
	}

	/**
	 * TODO: test
	 * @param {Document} document
	 */
	startAutoSave( document ) {
		this.stopAutoSave( document );

		this.autoSaveTimers[ document.id ] = setInterval( () => {
			// No document specify, means current.
			$e.run( 'document/save/auto', { document } );
		}, this.autoSaveInterval );
	}

	/**
	 * TODO: test
	 * @param {Document} document
	 */
	stopAutoSave( document ) {
		if ( this.autoSaveTimers[ document.id ] ) {
			clearInterval( this.autoSaveTimers[ document.id ] );

			delete this.autoSaveTimers[ document.id ];
		}
	}

	/**
	 * Function add().
	 *
	 * Add's document to the manager.
	 *
	 * @param {Document} document
	 *
	 * @returns {Document}
	 */
	add( document ) {
		const { id } = document;

		// Validate document is not already in use.
		if ( this.documents[ id ] ) {
			throw new Error( `Document with id: '${ id }', is already exist` );
		}

		// Save the document.
		this.documents[ id ] = document;

		return document;
	}

	/**
	 * Function addDocumentByConfig().
	 *
	 * Add document to manager by config.
	 *
	 * @param {{}} config
	 * @param {Container} container
	 *
	 * @returns {Document}
	 */
	addDocumentByConfig( config, container ) {
		return this.add( new Document( config, container ) );
	}

	/**
	 * Function get().
	 *
	 * Get document by id.
	 *
	 * @param {number} id
	 *
	 * @returns {Document|boolean}
	 */
	get( id ) {
		if ( undefined !== this.documents[ id ] ) {
			return this.documents[ id ];
		}

		return false;
	}

	/**
	 * Function getCurrent().
	 *
	 * Return's current document.
	 *
	 * @returns {Document}
	 */
	getCurrent() {
		return this.currentDocument;
	}

	/**
	 * Function getCurrentId().
	 *
	 * Return's current document id.
	 *
	 * @returns {number}
	 */
	getCurrentId() {
		return this.currentDocument.id;
	}

	/**
	 * Function setCurrent().
	 *
	 * set current document by document instance.
	 *
	 * @param {Document} document
	 */
	setCurrent( document ) {
		if ( undefined === this.documents[ document.id ] ) {
			throw Error( `The document with id: '${ document.id }' does not exist/loaded` );
		}

		if ( this.currentDocument ) {
			this.currentDocument.editorStatus = 'closed';
		}

		this.currentDocument = this.documents[ document.id ];
		this.currentDocument.editorStatus = 'open';

		elementorCommon.ajax.addRequestConstant( 'editor_post_id', document.id );
	}

	request( id ) {
		return elementorCommon.ajax.load( {
			action: 'get_document_config',
			unique_id: `document-${ id }`,
			data: { id },
			success: ( config ) => config,
			error: ( data ) => {
				let message;

				if ( _.isString( data ) ) {
					message = data;
				} else if ( data.statusText ) {
					message = elementor.createAjaxErrorMessage( data );

					if ( 0 === data.readyState ) {
						message += ' ' + elementor.translate( 'Cannot load editor' );
					}
				} else if ( data[ 0 ] && data[ 0 ].code ) {
					message = elementor.translate( 'server_error' ) + ' ' + data[ 0 ].code;
				}

				alert( message );
			},
		}, true );
	}
}
