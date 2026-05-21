'use client';
import { Component } from 'react';
import { withTranslation } from 'react-i18next';

import Header from '@/components/Header/Header';
import CircleSpinner from '@/components/Helpers/Spinner';
import { initMap } from '@/utils/visualizador';


import './Layout.css';

class Viewer extends Component {
    constructor(props) {
        super(props);
        this.state = {
            blocking: true
        };
    }

    componentDidMount() {
        initMap(this.block, this.unblock);
    }

    block = () => {
        this.setState({ blocking: true });
    }
    unblock = () => {
        this.setState({ blocking: false });
    }

    render() {
        const { blocking } = this.state;
        return (
            <>
                <div className='content-wrapper'>
                    <Header />
                    <div className='visor-wrapper' style={{ flexDirection: window.innerWidth < 700 ? 'column' : 'row' }}>
                        <div className='map' id='map'></div>
                    </div>
                </div>
                {blocking ?
                    <div className="block-loader-container">
                        <CircleSpinner width={128} height={128} />
                    </div>
                    : null
                }
            </>
        );
    }
}

export default withTranslation()(Viewer)