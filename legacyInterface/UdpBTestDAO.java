package com.uis.ddims.udp.dao;

/*
dDIMS 5.2 Upgrade Persistence Layer (iBATIS)
author sbShim 
 2007/11
*/
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.Properties;
import java.util.Vector;

import javax.naming.Context;
import javax.naming.InitialContext;
import javax.sql.DataSource;

import com.uis.ddims.cmn.ext.cfg.CmnXConstVars;
import com.uis.ddims.cmn.ext.util.CmnXListUtil;
import com.uis.ddims.cmn.ext.util.CmnXPropertyManager;
/**
* img_version Table DAO Class<br>
* @author R&D (Union Information Systems)
* @since 2005/02/22
*/

public class UdpBTestDAO {
           

           Connection goConnection = null;
           
           public ArrayList getTest() throws SQLException  
           {
                     StringBuffer sbBuffer = new StringBuffer();
                     ArrayList vtResult = new ArrayList();
                     PreparedStatement pstmt = null;
                     ResultSet rs = null;
                     

                     try {
                                sbBuffer.append("\n");
                                sbBuffer.append("SELECT * \n");
                                sbBuffer.append("  FROM IMG_PROFILE   \n");

                                goConnection = getConnection("java:dsed");
                                pstmt = goConnection.prepareStatement(sbBuffer.toString());

                                int liIndex = 1;
                                
                                rs = pstmt.executeQuery();

                                while(rs.next()) {
                                          System.out.println((String)rs.getString("INDEX01"));
                                          vtResult.add((String)rs.getString("INDEX01"));
                                }

                     } catch(SQLException ex) {
                                throw new SQLException("SQL Exception : " + ex.getMessage());
                     } finally {
                                try {rs.close();} catch(Exception e) {}
                                try {pstmt.close();} catch(Exception e) {}
                     }

                     return vtResult;
           }

    static Context ctx = null;

           public static Connection getConnection(String dataSourceName)
           {
               Connection con = null;

        try
                     {
            String initialContextFactory = "jeus.jndi.JEUSContextFactory";
                                String providerUrl = "10.10.20.27:9736";
                                //Initialize context with System property Info
                                Properties p = new Properties();
                                p.put(Context.INITIAL_CONTEXT_FACTORY, initialContextFactory);
                                p.put(Context.PROVIDER_URL, providerUrl);
                                ctx = new InitialContext(p);

                                DataSource ds = (DataSource)ctx.lookup(dataSourceName);
                                con = ds.getConnection();
        }catch (SQLException e)
        {
            e.printStackTrace();
         }
                     catch (Exception e)
        {
           e.printStackTrace();
        }
        return con;
           }
           

           public void closeConnection()
           {
                     try
                     {
                                if(goConnection != null) {
                                          goConnection.close();
                                          System.out.println("Connection Close .............");
                                }
                     }
                     catch(SQLException se)
                     {
                                System.out.println("=== InterfaceCommon.closeConnection() === EXCEPTION === \n" + se);
                     }
           }

}
