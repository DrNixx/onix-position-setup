import React from 'react';
import { expect } from 'chai';  
import { PosBuilder } from '../dist/js/chess/PosBuilder';
  
describe('<PosBuilder/>', function () {
    it('create PosBuilder and test some props', function () {
        var props = {
            size: 4, 
            orientation: "white",
            dialog: true
        };
        
        const wrapper = mount(<PosBuilder {...props} />);
        expect(wrapper.props().size).to.be.equal(4);
    });
});