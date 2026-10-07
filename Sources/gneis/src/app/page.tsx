'use client';
import { useEffect, useState } from 'react';
import i18next from '@/app/languages/i18n';

import CircleSpinner from '@/components/Helpers/Spinner';
import Layout from '@/components/Layout/Layout';

import '@/app/globals.css';

export default function Viewer() {
    const [blocking, setBlocking] = useState(true);
    const [hasMounted, setHasMounted] = useState(false);

    useEffect(() => {
        setHasMounted(true);
    }, []);

    useEffect(() => {
        if (!hasMounted || !window.IDEE || !blocking) return;

        const handleInit = () => {
            setBlocking(false);
        };

        if (i18next.isInitialized) {
            handleInit();
        } else {
            i18next.on('initialized', handleInit);
            return () => {
                i18next.off('initialized', handleInit); // cleanup to avoid memory leak
            };
        }
    }, [blocking, hasMounted]);

    if (!hasMounted) return null;


    return (
        <>
            {blocking ?
                <div className="block-loader-container">
                    <CircleSpinner width={256} height={256} />
                </div>
                :
                <div className="app-container">
                  <Layout />
                </div >
            }
        </>
    );
}
