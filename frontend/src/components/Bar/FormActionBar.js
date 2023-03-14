import { Link } from 'react-router-dom';

import { ActionButton } from "@components"

import "@style/Bar/FormActionBar.css"

const FormActionBar = ({ className, actions, style, actionStyle }) => {
    return (
        <div className={"actionBar " + className} style={style}>
            <div className="actions">
                {actions && actions.map(action => (
                    <div key={action.text} style={actionStyle}>
                        {action.to ? <Link className="internal-link" to={action.to}>
                            <ActionButton
                                className="primary"
                                icon={action.icon}
                                beforeText={action.text}
                                disabled={action.disabled}
                            />
                        </Link> : <ActionButton
                            className="primary"
                            icon={action.icon}
                            beforeText={action.text}
                            onClick={action.event}
                            disabled={action.disabled}
                            loading={action.loading}
                        />}
                    </div>
                ))}
            </div>
        </div>
    )
}

export { FormActionBar };