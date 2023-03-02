import { Link } from 'react-router-dom';

import { Help, IconButton } from "@components"

import "@style/Bar/FormActionBar.css"

const FormActionBar = ({ help, actions, style, helpStyle, actionStyle }) => {
    return (
        <div className="actionBar" style={style}>
            <div className="help" style={helpStyle}>
                {help && <Help text={help} />}
            </div>

            <div className="actions">
                {actions && actions.map(action => (
                    <div key={action.text} style={actionStyle}>
                        {action.to ? <Link className="internal-link" to={action.to}>
                            <IconButton
                                icon={action.icon}
                                text={action.text}
                                disabled={action.disabled}
                            />
                        </Link> : <IconButton
                            icon={action.icon}
                            text={action.text}
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