import { Route, Routes } from "react-router-dom";
import { useAccount, useSigner } from "wagmi";

import UserContextProvider from "@components/Dashboard/Provider/UserContextProvider";
import OrgContextProvider from "@components/Dashboard/Provider/OrgContextProvider";
import ErrorContextProvider from "@components/Dashboard/Provider/ErrorContextProvider";
import DashboardContent from "@components/Dashboard/Content/DashboardContent";
import OrgSidebar from "@components/Dashboard/Sidebar/OrgSidebar";
import HelpSidebar from "@components/Dashboard/Sidebar/HelpSidebar";
import Home from "@components/Dashboard/Home/Home";
import OrgForm from '@components/Dashboard/Org/OrgForm';
import BadgeForm from "@components/Dashboard/Org/BadgeForm";
import Badge from "@components/Dashboard/Org/Badge";
import Org from "@components/Dashboard/Org/Org";

import "@style/Dashboard/Dashboard.css";

const Dashboard = () => {
    const { data: signer } = useSigner();
    const { address } = useAccount();

    return (
        <div className="dashboard">
            <UserContextProvider signer={signer} address={address}>
                <OrgContextProvider>
                    <OrgSidebar address={address} />

                    <DashboardContent>
                        <ErrorContextProvider>
                            <Routes>
                                <Route path="/" element={ <Home /> } />
                                <Route path="/organization/new" element={ <OrgForm /> } />
                                <Route path="/organization/:orgId" element={ <Org /> } />
                                <Route path="/organization/:orgId/badge/new" element={ <BadgeForm /> } />
                                <Route path="/organization/:orgId/badge/:badgeId" element={ <Badge /> } />
                            </Routes>
                        </ErrorContextProvider>
                    </DashboardContent>

                    <HelpSidebar />

                </OrgContextProvider>
            </UserContextProvider>
        </div>
    )
}

export default Dashboard;