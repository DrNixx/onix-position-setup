import * as React from 'react';
import * as classNames from 'classnames';
import { copy } from './CopyToClipboard';
import { Intl } from './Intl';
import { Intl as IntlCore } from 'onix-core';
import { InputGroup, FormControl, FormControlProps, Button } from 'react-bootstrap';

export interface TextWithCopyProps extends FormControlProps {
    value?: string,
    placeholder?: string
}

export interface TextWithCopyState {
    className: string;
}

export class TextWithCopy extends React.Component<TextWithCopyProps, TextWithCopyState> {
    /**
     * constructor
     */
    constructor(props: TextWithCopyProps) {
        super(props);

        Intl.register();

        this.state = { 
            className: null,
        };
    }

    private onCopy = (e) => {
        if (copy(this.props.value)) {
            this.setSuccess();
        }
    }

    private setSuccess = () => {
        const that = this;
        this.setState({ 
            className: 'text-success',
        }, function() {
            setTimeout(that.setPrimary, 2000);
        });
    }

    private setPrimary = () => {
        this.setState({ 
            className: null,
        });
    }

    render() {
        let { id, size, placeholder, readOnly, ...elementProps } = this.props;

        return (
            <InputGroup size={size}>
                <FormControl 
                    size={size}
                    className={this.state.className} 
                    {...elementProps}
                    readOnly={true} 
                    placeholder={placeholder} />
                <InputGroup.Append>
                    <Button 
                        variant="primary" 
                        tabIndex={-1}
                        onClick={this.onCopy} 
                        title={IntlCore.t("builder", "copy_to_clipboard")}><i className="xi-copy"></i></Button>
                </InputGroup.Append>
            </InputGroup>
        );
    }
}