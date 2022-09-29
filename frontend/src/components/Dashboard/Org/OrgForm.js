import { useState } from "react";
import { useNavigate } from "react-router-dom";

import Header from "../Header/Header";
import ActionBar from "../Form/ActionBar";

import Input from "../Form/Input";

const OrgForm = () => {
    const [orgName, setOrgName] = useState("");
    const [orgSymbol, setOrgSymbol] = useState("");

    const navigate = useNavigate();

    const actions = [
        {
            text: "CREATE",
            icon: ["fal", "arrow-right"],
            event: () => onOrgFormSubmission()
        }
    ]

    const nameToSymbol = (name) => {
        return name.replace(/[^a-zA-Z0-9]/g, "").toUpperCase().substring(0, 5);
    }

    const onOrgNameChange = (e) => {
        setOrgName(e.target.value)

        if (orgSymbol === nameToSymbol(orgName)) {
            setOrgSymbol(nameToSymbol(e.target.value));
        }
    }

    // TODO: Hook up contracts/API
    const onOrgFormSubmission = () => {
        console.log('Org Name', orgName, "orgSymbol", orgSymbol)
        const orgAddress = "0x1234567890";

        navigate(`/dashboard/organization/org=${orgAddress}`);
    }

    return (
        <div id="new-org">
            <Header back={() => navigate(-1)} />

            <h2>Create Organization</h2>

            <Input 
                name="orgName"
                label="Organization Name" 
                required={true}
                value={orgName} 
                onChange={onOrgNameChange} 
            />

            <Input
                name="orgSymbol"
                label="Organization Symbol"
                required={true}
                value={orgSymbol}
                onChange={(e) => setOrgSymbol(e.target.value)}
            />

            <ActionBar 
                help={"Badge creation occurs after your organization has been established."} 
                actions={actions} 
            />
        </div>
    )
}

export default OrgForm;