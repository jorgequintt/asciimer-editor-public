import React, { Component } from 'react'
import _ from 'lodash';

// Style
import { Classes, Dialog as BPDialog } from '@blueprintjs/core';

export class Dialog extends Component {
    render() {
        const { important, title, dialogBody, dialogFooter, dialogFooterActions } = this.props;
        const blueprintDialogProps = _.omit(this.props, ["important", "title", "dialogBody", "dialogFooter", "dialogFooterActions"])

        return <BPDialog
            lazy={true}
            className={Classes.DARK}
            title={title}
            canEscapeKeyClose={!important} // undefined if not set, which turn into true
            canOutsideClickClose={!important} // undefined if not set, which turn into true
            {...blueprintDialogProps} // event listener, maybe blueprint dialog props...
        >
            {dialogBody && <div className={Classes.DIALOG_BODY}>
                {dialogBody}
            </div>}
            {(dialogFooter || dialogFooterActions) && <div className={Classes.DIALOG_FOOTER}>
                {dialogFooter}
                {dialogFooterActions && <div className={Classes.DIALOG_FOOTER_ACTIONS}>
                    {dialogFooterActions}
                </div>}
            </div>}
        </BPDialog>
    }
}

export default Dialog;
