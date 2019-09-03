import * as React from 'react';
import { Intl } from 'onix-core';
import { FenEmptyBoard, FenStandartStart, IOpeningPosition } from 'onix-chess';
import { FormControl, FormControlProps } from 'react-bootstrap';
import { Intl as IntlCtrl } from '../Intl';

export interface StartPosSelectorProps extends FormControlProps {
    fen?: string,
    openingsPos: IOpeningPosition[],
    onChangeFen?: (fen: string) => void,
}

export class StartPosSelector extends React.Component<StartPosSelectorProps, {}> {
    /**
     * constructor
     */
    constructor(props: StartPosSelectorProps) {
        super(props);
        IntlCtrl.register();
    }

    private onChange = (e) => {
        let fen: string = e.target.value; 

        if (fen === "---") {
            fen = window.prompt(Intl.t("chess-ctrls", "paste_fen_prompt"), "");
        }

        if (this.props.onChange) {
            this.props.onChangeFen(fen);
        }
    }

    private getOpenings = (openingsPos) => {
        if (openingsPos && openingsPos.length) {
            let openings = [];
            for (let i = 0; i < openingsPos.length; i++) {
                const option = openingsPos[i];
                openings.push(
                    <option key={i} value={option.fen}>{option.name}</option>
                );
            }

            return (
                <optgroup label={Intl.t("chess-ctrls", "popular_opening")}>
                    {openings}
                </optgroup>
            );

        } else {
            return null;
        }
    }
    
    render() {
        let { fen, openingsPos } = this.props;
        fen = fen || "";
        
        return (
            <FormControl as="select" size="sm" onChange={this.onChange} value={fen}>
                <optgroup label={Intl.t("chess-ctrls", "set_board")}>
                    <option value="">{Intl.t("chess-ctrls", "position_label")}</option>
                    <option value={FenStandartStart}>{Intl.t("chess-ctrls", "std_fen")}</option>
                    <option value={FenEmptyBoard}>{Intl.t("chess-ctrls", "empty_fen")}</option>
                    <option value="---">{Intl.t("chess-ctrls", "get_fen")}</option>
                </optgroup>
                {this.getOpenings(openingsPos)}
            </FormControl>
        );
    }
}
