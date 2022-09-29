import { useState } from "react";
import { 
    Table, TableHead, TableRow, 
    TableContainer, TableCell, TableBody 
} from "@mui/material"

import TableSortHead from "./TableSortHead";
import { sliceAddress, compareByProperty } from "@utils/helpers";
import { holderHeadRows } from "@static/constants/constants";

import "@style/Table/HolderTable.css";

const HolderTable = ({ holders }) => {
    const [ headRows, setHeadRows ] = useState(holderHeadRows);
    const [ sortedList, setSortedList ] = useState(holders);

    const onSortChange = (key) => {
        // Get the current sort method and inverse it for chevron display.
        let newHeadRows = {...headRows};
        let method = newHeadRows[key].method 
        method = !method || method === "desc" ? "asc" : "desc"
        newHeadRows[key].method = method;
        setHeadRows(newHeadRows);

        // Sort the list by the key and the method.
        let newSortedList = [...sortedList];
        newSortedList = newSortedList.sort((a,b) => 
            compareByProperty(key, method, a, b)
        );
        setSortedList(newSortedList);
    }

    return (
        <div id="holder__table">
            <TableContainer>
                <Table aria-label="simple table">
                    <TableHead>
                        <TableRow>
                            {Object.keys(headRows).map((key) => (
                                 <TableSortHead
                                    key={key}
                                    id={key}
                                    label={headRows[key].label}
                                    sortMethod={headRows[key].method}
                                    onSortChange={onSortChange}
                                    align={key === "delegate" ? "right" : "left"}
                                />
                            ))}
                        </TableRow>
                    </TableHead>

                    <TableBody>
                    {sortedList.map((holder) => (
                        <TableRow
                            key={holder.address}
                            sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                        >
                            <TableCell component="th" scope="row">
                                {sliceAddress(holder.address)}
                            </TableCell>
                            <TableCell>{holder.receivedAt}</TableCell>
                            <TableCell>{holder.nickname}</TableCell>
                            <TableCell>{holder.pod}</TableCell>
                            <TableCell>
                                <div className={`delegate__status__${holder.delegate}`}>
                                    <span>{holder.delegate ? "Yes" : "No"}</span>
                                </div>
                            </TableCell>
                        </TableRow>
                    ))}
                    </TableBody>
                </Table>
            </TableContainer>
        </div>
    )
}

export default HolderTable