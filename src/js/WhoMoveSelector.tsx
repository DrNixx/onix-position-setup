import toSafeInteger from 'lodash-es/toSafeInteger';
import * as React from 'react';
import { Intl } from 'onix-core';
import { Intl as IntlCtrls } from 'onix-chess';
import * as cg from 'chessground/types';
import { FormControl, FormControlProps } from 'react-bootstrap';

export interface WhoMoveSelectorProps extends FormControlProps {
    defaultTurn?: cg.Color;
    onChangeTurn?: (color: cg.Color) => void;
}

export class WhoMoveSelector extends React.Component<WhoMoveSelectorProps, {}> {
    public static defaultProps: WhoMoveSelectorProps = {
        defaultTurn: 'white',
    }

    /**
     * constructor
     */
    constructor(props: WhoMoveSelectorProps) {
        super(props);

        IntlCtrls.register();
    }

    private onChange = (e) => {
        const { onChangeTurn } = this.props;
        
        if (onChangeTurn) {
            onChangeTurn(e.target.value);
        }
    }

    render() {
        const { defaultTurn } = this.props;
        return (
            <FormControl as="select" size="sm" onChange={this.onChange} defaultValue={defaultTurn.toString()}>
                <option value="white">{Intl.t("chess", "white_move")}</option>
                <option value="black">{Intl.t("chess", "black_move")}</option>
            </FormControl>
        );
    }
}
