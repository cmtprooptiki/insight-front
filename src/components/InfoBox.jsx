import React from 'react';
import { Card } from 'primereact/card';
import { format } from 'date-fns';

const InfoBox = ({ startDate, endDate }) => {
    let dateRange;
    const start = new Date(startDate);
    const end = new Date(endDate);

    const formatDate = (date) => {
        try {
            return format(new Date(date), 'd MMMM');
        } catch (e) {
            return '';
        }
    };

    const formatYear = (date) => {
        try {
            return format(new Date(date), 'yyyy');
        } catch (e) {
            return '';
        }
    };
    // const dateRange = `${formatDate(startDate)} – ${formatDate(endDate)} ${formatYear(endDate)}`;
    if (formatYear(start) === formatYear(end)) {
        dateRange = `${formatDate(start)} – ${formatDate(end)} ${formatYear(end)}`;
    } else {
        dateRange = `${formatDate(start)} ${formatYear(start)} – ${formatDate(end)} ${formatYear(end)}`;
    }

    return (
        <Card
            title="📅 Date Range"
            style={{
                position: 'fixed',
                top: '100px',
                right: '20px',
                width: '260px',
                zIndex: 1000,
                border: '1px solid #007ad9',
                boxShadow: '0 4px 12px rgba(0, 122, 217, 0.2)',
                backgroundColor: '#e6f0fa',
                color: '#003f7f'
            }}
            header={<div style={{ backgroundColor: '#007ad9', height: '6px' }} />}
        >
            <div style={{ fontSize: '1.1rem', fontWeight: 'bold', textAlign: 'center' }}>
                {dateRange}
            </div>
        </Card>
    );
};

export default InfoBox;
