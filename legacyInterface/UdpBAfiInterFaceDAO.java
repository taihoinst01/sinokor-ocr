package com.uis.ddims.udp.dao;

import java.math.BigDecimal;
import java.net.InetSocketAddress;
import java.net.SocketAddress;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import com.sds.afi.rte.litclt.SimpleMomClientMap;
import com.uis.ddims.cmn.ext.util.CmnXDateUtil;
import com.uis.ddims.cmn.ext.util.CmnXPropertyManager;
import com.uis.ddims.udp.util.UdpGuidUtil;



public class UdpBAfiInterFaceDAO {

             private String clientInfo = CmnXPropertyManager.getProperties("AFI_VER");
             private String AFI_IP = CmnXPropertyManager.getProperties("AFI_IP");
             private String AFI_EDMS = CmnXPropertyManager.getProperties("AFI_EDMS");
             private int AFI_PORT = Integer.parseInt(CmnXPropertyManager.getProperties("AFI_PORT"));

             public ArrayList getSendRequest(HashMap pMap)
             {
                      System.out.println("==============================================================================");
                      System.out.println("==============================================================================");
                     System.out.println("솔로몬 연계 시작 시간 =" + CmnXDateUtil.getTimestamp());
                      System.out.println("==============================================================================");
                      System.out.println("==============================================================================");
                       
               SimpleMomClientMap momMapClient = null;
               ArrayList rtnArr = new ArrayList();
               try
               {
                 List addrList = new ArrayList();

                 System.out.println("new InetSocketAddress start =" + CmnXDateUtil.getTimestamp());
                 addrList.add(new InetSocketAddress(this.AFI_IP, this.AFI_PORT));
                 System.out.println("new InetSocketAddress end =" + CmnXDateUtil.getTimestamp());
                 
                 System.out.println("new SimpleMomClientMap start =" + CmnXDateUtil.getTimestamp());
                 momMapClient = new SimpleMomClientMap(this.clientInfo, addrList);
                 System.out.println("new SimpleMomClientMap end =" + CmnXDateUtil.getTimestamp());
                 
                 System.out.println("=> LOGIN Start=" + CmnXDateUtil.getTimestamp());
                 if (momMapClient.login()) {
                       System.out.println("=> LOGIN OK=" + CmnXDateUtil.getTimestamp());
                   Map resmap = null;

                   pMap.put("appYrmm", "201302");
                   pMap.put("saOcrnSno", new BigDecimal("1"));
                   System.out.println("MSG0000533");
                   System.out.println(getClass() + ": start[getSendRequest]");

                   resmap = (Map)momMapClient.sendRequest("MSG0000533", "SVC0000281", pMap);
                   if (resmap != null) {
                     System.out.println("=> response [" + resmap + "]");
                   }
                 }

                 momMapClient.logout();
               }
               catch (Exception ex) {
                 ex.printStackTrace();
                 momMapClient.logout();
               }
               
                      System.out.println("==============================================================================");
                      System.out.println("==============================================================================");
                     System.out.println("솔로몬 연계 종료 시간 =" + CmnXDateUtil.getTimestamp());
                      System.out.println("==============================================================================");
                      System.out.println("==============================================================================");
               
               return rtnArr;
             }

             public ArrayList getSendSyncNotify(HashMap pMap)
             {
                                System.out.println("==============================================================================");
                                System.out.println("==============================================================================");
                                System.out.println("솔로몬 연계 시작 시간 =" + CmnXDateUtil.getTimestamp());
                                System.out.println("==============================================================================");
                                System.out.println("==============================================================================");
                                  
                       
               SimpleMomClientMap momMapClient = null;
               ArrayList rtnArr = new ArrayList();
               try {
                 List addrList = new ArrayList();
                 addrList.add(new InetSocketAddress(this.AFI_IP, this.AFI_PORT));

                 momMapClient = new SimpleMomClientMap(this.clientInfo, addrList);
                 System.out.println("=> LOGIN Start=" + CmnXDateUtil.getTimestamp());
                 if (momMapClient.login())
                 {
                       System.out.println("=> LOGIN OK=" + CmnXDateUtil.getTimestamp());
                   String msgId = UdpGuidUtil.buildGuid("MSG0000529");
                   pMap.put("globalSysId", msgId);

                   String status = momMapClient.sendSyncNotify("MSG0000529", "SVC0000279", pMap);
                   if (status.equals("200")) {
                     System.out.println("정상처리");
                   }
                   else if (status.equals("999")) {
                     System.out.println("실패");
                   }
                   else {
                     System.out.println("알 수 없는 처리 결과입니다.");
                   }
                 }
                 momMapClient.logout();
               }
               catch (Exception e)
               {
                 e.printStackTrace();
                 momMapClient.logout();
               }
               
                      System.out.println("==============================================================================");
                      System.out.println("==============================================================================");
                     System.out.println("솔로몬 연계 종료 시간 =" + CmnXDateUtil.getTimestamp());
                      System.out.println("==============================================================================");
                      System.out.println("==============================================================================");
               
               return rtnArr;
             }

             public Map getSendRequest(HashMap pMap, String id, String serviceid)
             {
                                System.out.println("==============================================================================");
                                System.out.println("==============================================================================");
                                System.out.println("솔로몬 연계 시작 시간 getSendRequest =" + CmnXDateUtil.getTimestamp());
                                System.out.println("==============================================================================");
                                System.out.println("==============================================================================");
                                  
                       
               SimpleMomClientMap momMapClient = null;
               Map resmap = null;

               Map reqHeader = new HashMap();
               Map req = new HashMap();
               try
               {
//               List addrList = new ArrayList();
//
//               System.out.println("getSendRequest new InetSocketAddress start =" + CmnXDateUtil.getTimestamp());
//               addrList.add(new InetSocketAddress(this.AFI_IP, this.AFI_PORT));
//               System.out.println("getSendRequest new InetSocketAddress end =" + CmnXDateUtil.getTimestamp());

                 System.out.println("getSendRequest new SimpleMomClientMap start =" + CmnXDateUtil.getTimestamp());
//               momMapClient = new SimpleMomClientMap(this.clientInfo, addrList);
                 momMapClient = new SimpleMomClientMap(this.clientInfo, this.AFI_IP, this.AFI_PORT);
                 System.out.println("getSendRequest new SimpleMomClientMap end =" + CmnXDateUtil.getTimestamp());
                 
                 System.out.println("=>getSendRequest LOGIN Start=" + CmnXDateUtil.getTimestamp());
                 if (momMapClient.login())
                 {
                       System.out.println("=>getSendRequest LOGIN OK=" + CmnXDateUtil.getTimestamp());
                   System.out.println(getClass() + ": start[getSendRequest]");
                   String msgId = UdpGuidUtil.buildGuid(id);
                   reqHeader.put("userId", pMap.get("userId"));
                   reqHeader.put("lginIpAdr", pMap.get("lginIpAdr"));
                   reqHeader.put("globalSysId", msgId);
                   reqHeader.put("clntDvNm", this.AFI_EDMS);
                   req.put("ApplicationHeader", reqHeader);

                   req.put(pMap.get("value"), pMap);

                   System.out.println("req : " + req);
                   resmap = (Map)momMapClient.sendRequest(id, serviceid, req);
                   if (resmap != null) {
                     System.out.println("=> response [" + resmap + "]");
                   }
                 }

                 momMapClient.logout();
               }
               catch (Exception ex) {
                 ex.printStackTrace();
                 momMapClient.logout();
               }
               
                      System.out.println("==============================================================================");
                      System.out.println("==============================================================================");
                     System.out.println("솔로몬 연계 종료 시간 getSendRequest =" + CmnXDateUtil.getTimestamp());
                      System.out.println("==============================================================================");
                      System.out.println("==============================================================================");
               
               return resmap;
             }

             public ArrayList getSendNotify(HashMap pMap, String id, String serviceid)
             {
                                System.out.println("==============================================================================");
                                System.out.println("==============================================================================");
                                System.out.println("솔로몬 연계 시작 시간 getSendNotify =" + CmnXDateUtil.getTimestamp());
                                System.out.println("==============================================================================");
                                System.out.println("==============================================================================");
                                  
                       
               SimpleMomClientMap momMapClient = null;
               ArrayList rtnArr = new ArrayList();

               Map reqHeader = new HashMap();
               Map req = new HashMap();
               try
               {
//               List addrList = new ArrayList();
//               System.out.println("getSendNotify new InetSocketAddress start =" + CmnXDateUtil.getTimestamp());
//               addrList.add(new InetSocketAddress(this.AFI_IP, this.AFI_PORT));
//               System.out.println("getSendNotify new InetSocketAddress end =" + CmnXDateUtil.getTimestamp());

                 System.out.println("getSendNotify new SimpleMomClientMap start =" + CmnXDateUtil.getTimestamp());
//               momMapClient = new SimpleMomClientMap(this.clientInfo, addrList);
                 momMapClient = new SimpleMomClientMap(this.clientInfo, this.AFI_IP, this.AFI_PORT);
                 System.out.println("getSendNotify new SimpleMomClientMap end =" + CmnXDateUtil.getTimestamp());
                 
                 System.out.println("=>getSendNotify LOGIN Start=" + CmnXDateUtil.getTimestamp());
                 if (momMapClient.login())
                 {
                       System.out.println("=>getSendNotify LOGIN OK=" + CmnXDateUtil.getTimestamp());
                   String msgId = UdpGuidUtil.buildGuid(id);

                   reqHeader.put("userId", pMap.get("userId"));
                   reqHeader.put("lginIpAdr", pMap.get("lginIpAdr"));
                   reqHeader.put("globalSysId", msgId);
                   reqHeader.put("clntDvNm", this.AFI_EDMS);
                   req.put("ApplicationHeader", reqHeader);

                   req.put(pMap.get("value"), pMap);

                   momMapClient.sendNotify(id, serviceid, req);
                 }
                 momMapClient.logout();
               }
               catch (Exception e)
               {
                 e.printStackTrace();
                 momMapClient.logout();
               }
               
                      System.out.println("==============================================================================");
                      System.out.println("==============================================================================");
                     System.out.println("솔로몬 연계 종료 시간 getSendNotify =" + CmnXDateUtil.getTimestamp());
                      System.out.println("==============================================================================");
                      System.out.println("==============================================================================");
               
               return rtnArr;
             }

             public ArrayList getEntryList(HashMap pMap)
             {
               ArrayList rtnArr = new ArrayList();

               return rtnArr;
             }

             public ArrayList getEntryListHB(HashMap pMap)
             {
               ArrayList rtnArr = new ArrayList();

               return rtnArr;
             }

             public ArrayList getUWCodeNAT(HashMap pMap)
             {
               ArrayList rtnArr = new ArrayList();

               return rtnArr;
             }

             public ArrayList getUWCodeCO(HashMap pMap)
             {
               ArrayList rtnArr = new ArrayList();

               return rtnArr;
             }

             public ArrayList getUWCodeFITEM(HashMap pMap) {
               ArrayList rtnArr = new ArrayList();

               return rtnArr;
             }

             public ArrayList getUWCodeINDTYPE(HashMap pMap) {
               ArrayList rtnArr = new ArrayList();

               return rtnArr;
             }
           // 20150805 - 해당 소스 수정후 반영 시 오류가 발생하여 운영계 class 역컴파일 해서 작업 진
//         private String clientInfo = CmnXPropertyManager.getProperties("AFI_VER");
//         private String AFI_IP = CmnXPropertyManager.getProperties("AFI_IP");
//         private String AFI_IP2 = CmnXPropertyManager.getProperties("AFI_IP2");
//         private String AFI_EDMS = CmnXPropertyManager.getProperties("AFI_EDMS");
//         private int AFI_PORT = Integer.parseInt(CmnXPropertyManager.getProperties("AFI_PORT"));
//         private int AFI_PORT2 = Integer.parseInt(CmnXPropertyManager.getProperties("AFI_PORT2"));
//         private long AFI_TIME_OUT = 185000;
//         
//         
//         public ArrayList getSendRequest(HashMap pMap)  
//         {
//                    System.out.println("==============================================================================");
//                    System.out.println("==============================================================================");
//                   System.out.println("솔로몬 연계 시작 시간 =" + CmnXDateUtil.getTimestamp());
//                    System.out.println("==============================================================================");
//                    System.out.println("==============================================================================");
//                   
//                   SimpleMomClientMap momMapClient= null;
//                   ArrayList rtnArr = new ArrayList();
//                   //MapClient = startSqlMapKoreanre.getSqlMap();
//                   try {
//                              List<SocketAddress> addrList = new ArrayList<SocketAddress>();
//                              
//                              addrList.add( new InetSocketAddress(AFI_IP, AFI_PORT) );
//                              addrList.add( new InetSocketAddress(AFI_IP2, AFI_PORT2) );
//
//                              momMapClient = new SimpleMomClientMap(clientInfo, addrList);
//                              System.out.println("=> LOGIN Start=" + CmnXDateUtil.getTimestamp());
//                              if (momMapClient.login()) {
//                                        System.out.println("=> LOGIN OK=" + CmnXDateUtil.getTimestamp());
//                                        Map<String, Object> resmap = null;
//                                        /* sync call */
//                                        // TODO request map 만드는 로직
//                                        pMap.put("appYrmm", "201302");
//                                        pMap.put("saOcrnSno", new BigDecimal("1"));
//                                        System.out.println("MSG0000533");
//                                        System.out.println(this.getClass()+": start[getSendRequest]");
//                                        
//                                        resmap = (Map<String, Object>) momMapClient.sendRequest("MSG0000533", "SVC0000281", pMap, AFI_TIME_OUT);
//                                        
//                                        if(resmap != null){
//                                                   System.out.println("=> response ["+resmap+"]");
//                                        // TODO something
//                                        }
//                              }
//                              momMapClient.logout();
//                   }
//                   catch (Exception ex) {
//                              ex.printStackTrace(); // TODO error handling
//                              momMapClient.logout();
//                   }
//                   
//                    System.out.println("==============================================================================");
//                    System.out.println("==============================================================================");
//                   System.out.println("솔로몬 연계 종료 시간 =" + CmnXDateUtil.getTimestamp());
//                    System.out.println("==============================================================================");
//                    System.out.println("==============================================================================");
//                   
//                   return rtnArr;
//         }
//         
//
//         public ArrayList getSendSyncNotify(HashMap pMap)  
//         {
//                    System.out.println("==============================================================================");
//                    System.out.println("==============================================================================");
//                   System.out.println("솔로몬 연계 시작 시간 =" + CmnXDateUtil.getTimestamp());
//                    System.out.println("==============================================================================");
//                    System.out.println("==============================================================================");
//                   
//                   SimpleMomClientMap momMapClient= null;
//                   ArrayList rtnArr = new ArrayList();
//                   try {
//                                        List<SocketAddress> addrList = new ArrayList<SocketAddress>();
//                                        addrList.add( new InetSocketAddress(AFI_IP, AFI_PORT)); // AFI에 접속하기 위한정보.
//                                        addrList.add( new InetSocketAddress(AFI_IP2, AFI_PORT2)); // AFI에 접속하기 위한정보.
//                                        // set AFI MOM IP/Port 및 client info
//                                        momMapClient = new SimpleMomClientMap(clientInfo, addrList);
//                                        System.out.println("=> LOGIN Start=" + CmnXDateUtil.getTimestamp());
//                                        if (momMapClient.login()) {
//                                                   
//                                        System.out.println("=> LOGIN OK=" + CmnXDateUtil.getTimestamp());
//                                        /* sync call */
//                                        // TODO request map 만드는 로직
//                                        String msgId = UdpGuidUtil.buildGuid("MSG0000529");
//                                        pMap.put("globalSysId", msgId);
//                                                   
//                                        String status = momMapClient.sendSyncNotify("MSG0000529", "SVC0000279", pMap);
//                                        if(status.equals("200")){
//                                                   System.out.println("정상처리");
//                                        }
//                                        else if(status.equals("999")){
//                                                   System.out.println("실패");
//                                        }
//                                        else{
//                                                   System.out.println("알 수 없는 처리 결과입니다.");
//                                        }
//                              }
//                              momMapClient.logout();
//                   }
//                   catch(Exception e){
//                              // TODO error handling
//                              e.printStackTrace();
//                              momMapClient.logout();
//                   }
//                   
//                    System.out.println("==============================================================================");
//                    System.out.println("==============================================================================");
//                   System.out.println("솔로몬 연계 종료 시간 =" + CmnXDateUtil.getTimestamp());
//                    System.out.println("==============================================================================");
//                    System.out.println("==============================================================================");
//                   
//                   return rtnArr;
//         }
//         
//         
//
//         public Map getSendRequest(HashMap pMap, String id, String serviceid)  
//         {
//                    System.out.println("==============================================================================");
//                    System.out.println("==============================================================================");
//                   System.out.println("솔로몬 연계 시작 시간 =" + CmnXDateUtil.getTimestamp());
//                    System.out.println("==============================================================================");
//                    System.out.println("==============================================================================");
//                   
//                   SimpleMomClientMap momMapClient= null;
//                   Map resmap = null;
//
//                   Map reqHeader = new HashMap();
//                   Map req = new HashMap();
//                   
//                   //MapClient = startSqlMapKoreanre.getSqlMap();
//                   try {
//                              List<SocketAddress> addrList = new ArrayList<SocketAddress>();
//                              
//                              addrList.add( new InetSocketAddress(AFI_IP, AFI_PORT) );
//                              addrList.add( new InetSocketAddress(AFI_IP2, AFI_PORT2) );
//
//                              momMapClient = new SimpleMomClientMap(clientInfo, addrList);
//                              System.out.println("=> LOGIN Start=" + CmnXDateUtil.getTimestamp());
//                              if (momMapClient.login()) {
//                                        System.out.println("=> LOGIN OK=" + CmnXDateUtil.getTimestamp());
//                                        /* sync call */
//                                        // TODO request map 만드는 로직
//                                        System.out.println(this.getClass()+": start[getSendRequest]");
//                                        String msgId = UdpGuidUtil.buildGuid(id);
//                                        reqHeader.put("userId", pMap.get("userId"));
//                                        reqHeader.put("lginIpAdr", pMap.get("lginIpAdr"));
//                                        reqHeader.put("globalSysId", msgId);
//                                        reqHeader.put("clntDvNm", AFI_EDMS);
//                                        req.put("ApplicationHeader", reqHeader);
//                                        
//                                        req.put(pMap.get("value"), pMap);
//                                        
//                                        System.out.println("req : "+req);
//                                        resmap = (Map)momMapClient.sendRequest(id, serviceid, req, AFI_TIME_OUT);
//                                        if(resmap != null){
//                                                   System.out.println("=> response ["+resmap+"]");
//                                        // TODO something
//                                        }
//                              }
//                              momMapClient.logout();
//                   }
//                   catch (Exception ex) {
//                              ex.printStackTrace(); // TODO error handling
//                              momMapClient.logout();
//                   }
//                   
//                    System.out.println("==============================================================================");
//                    System.out.println("==============================================================================");
//                   System.out.println("솔로몬 연계 종료 시간 =" + CmnXDateUtil.getTimestamp());
//                    System.out.println("==============================================================================");
//                    System.out.println("==============================================================================");
//                   
//                   return resmap;
//         }
//         
//
//         public ArrayList getSendNotify(HashMap pMap, String id, String serviceid)  
//         {
//                    System.out.println("==============================================================================");
//                    System.out.println("==============================================================================");
//                   System.out.println("솔로몬 연계 시작 시간 =" + CmnXDateUtil.getTimestamp());
//                    System.out.println("==============================================================================");
//                    System.out.println("==============================================================================");
//                   
//                   SimpleMomClientMap momMapClient= null;
//                   ArrayList rtnArr = new ArrayList();
//
//                   Map reqHeader = new HashMap();
//                   Map req = new HashMap();
//                   
//                   try {
//                              List<SocketAddress> addrList = new ArrayList<SocketAddress>();
//                              addrList.add( new InetSocketAddress(AFI_IP, AFI_PORT) ); // AFI에 접속하기 위한정보.
//                              addrList.add( new InetSocketAddress(AFI_IP2, AFI_PORT2) ); // AFI에 접속하기 위한정보.
//                              // set AFI MOM IP/Port 및 client info
//                              momMapClient = new SimpleMomClientMap(clientInfo, addrList);
//                              
//                              System.out.println("=> LOGIN Start=" + CmnXDateUtil.getTimestamp());
//                              
//                              if (momMapClient.login()) {
//                                        System.out.println("=> LOGIN OK=" + CmnXDateUtil.getTimestamp());
//                                        /* async call */
//                                        // TODO request map 만드는 로직
//
//                                        String msgId = UdpGuidUtil.buildGuid(id);
//
//                                        reqHeader.put("userId", pMap.get("userId"));
//                                        reqHeader.put("lginIpAdr", pMap.get("lginIpAdr"));
//                                        reqHeader.put("globalSysId", msgId);
//                                        reqHeader.put("clntDvNm", AFI_EDMS);
//                                        req.put("ApplicationHeader", reqHeader);
//                                        
//                                        req.put(pMap.get("value"), pMap);
//                                        
//                                        momMapClient.sendNotify(id, serviceid, req);
//                              }
//                              momMapClient.logout();
//                   }
//                   catch(Exception e){
//                              // TODO error handling
//                              e.printStackTrace();
//                              momMapClient.logout();
//                   }
//                   
//                    System.out.println("==============================================================================");
//                    System.out.println("==============================================================================");
//                   System.out.println("솔로몬 연계 종료 시간 =" + CmnXDateUtil.getTimestamp());
//                    System.out.println("==============================================================================");
//                    System.out.println("==============================================================================");
//                   
//                   return rtnArr;
//         }
//         
//         
//         
//         
//         public ArrayList getEntryList(HashMap pMap){
//
//                   ArrayList rtnArr = new ArrayList();
//                   
//                   
//                   return rtnArr;
//         }
//
//         public ArrayList getEntryListHB(HashMap pMap){
//
//                   ArrayList rtnArr = new ArrayList();
//                   
//                   
//                   return rtnArr;
//         }
//         
//         public ArrayList getUWCodeNAT(HashMap pMap){
//
//                   ArrayList rtnArr = new ArrayList();
//                   
//                   
//                   return rtnArr;
//         }          
//
//         public ArrayList getUWCodeCO(HashMap pMap){
//
//                   ArrayList rtnArr = new ArrayList();
//                   
//                   
//                   return rtnArr;
//         }          
//         public ArrayList getUWCodeFITEM(HashMap pMap){
//
//                   ArrayList rtnArr = new ArrayList();
//                   
//                   
//                   return rtnArr;
//         }          
//         public ArrayList getUWCodeINDTYPE(HashMap pMap){
//
//                   ArrayList rtnArr = new ArrayList();
//                   
//                   
//                   return rtnArr;
//         }          
}