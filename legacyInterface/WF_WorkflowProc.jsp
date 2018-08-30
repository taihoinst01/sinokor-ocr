
<%
/* =====================================================================
시스템명    : 코리안리 문서관리 시스템
프로그램 Id : CM_ListProc.jsp
프로그램명  : 리스트 처리 페이지
개발자      : 강지형
개발부서    :
개발일자    : 2013.03.12
수정자      :
수정부서    :
수정일자    :
설명        : 
 매개변수    : 
===================================================================== */
%>

<%@ page language="java" contentType="text/html;charset=UTF-8" pageEncoding="UTF-8"%>
<% response.setContentType("text/html;charset=UTF-8");%>
<% request.setCharacterEncoding("UTF-8");%>
<%@ page import="java.util.ArrayList "%>
<%@ page import="java.util.HashMap" %>
<%@ page import="java.util.Map" %>

<%@ page import="com.uis.ddims.cmn.ext.util.CmnXListUtil" %>

<%@ page import="com.uis.ddims.udp.dg.UdpDSearch" %>


<%@ page import="com.uis.ddims.img.dg.*" %>
<%@ page import="com.uis.ddims.cmn.dg.*" %>
<%@ page import="com.uis.ddims.udp.dg.UdpDModify" %>
<%@ page import="com.uis.ddims.udp.dao.UdpBAfiInterFaceDAO" %>

<%@ page import="com.uis.ddims.cmn.ext.util.*"%>
<%@ page import="com.uis.ddims.cmn.ext.arch.*"%>
<%@ page import="com.uis.ddims.img.vo.*"%>
<%@ page import="com.uis.ddims.cmn.vo.*"%>

<%@ include file="../../include/IC_UtfEncoding.jsp" %>


<%
    /**
        조회업무 구분코드 설명
        WF_GetTreeList
        WF_GetInitialList
        WF_ApprovalCancel           : 결재취소
        WF_RemarkUpdate
        WF_ImgDelete
        WF_Registration
        WF_ReturnRegistration       : 반려
        WF_GetAllApprovalList
        WF_AllRegistration
        WF_AllReturnRegistration        
    */
    
    String lsLocalIp = request.getRemoteAddr();   // 로컬PC IP
    String lsAfiUserId = CmnXListUtil.IsNullStr((String)session.getAttribute("ssUsrId"));
    String lsLangGb     = CmnXListUtil.IsNullStr((String)session.getAttribute("ssLangGb"));
    String ssC_APP      = CmnXListUtil.IsNullStr((String)session.getAttribute("ssC_APP"));
    String ssC_MIDUSE   = CmnXListUtil.IsNullStr((String)session.getAttribute("ssC_MIDUSE"));
    String ssKrFlag     = CmnXListUtil.IsNullStr((String)session.getAttribute("ssKrFlag"));
    String ssKRDptCode      = CmnXListUtil.IsNullStr((String)session.getAttribute("ssKRDptCode"));
    String lsServerId      = CmnXListUtil.IsNullStr((String)session.getAttribute("ssServerId"));
    String lsTeamCode      = CmnXListUtil.IsNullStr((String)session.getAttribute("ssTeamCode"));    
    
    String lsGuBun      = CmnXListUtil.IsNullStr(request.getParameter("gubun"));        //조회 업무구분
    
    String v_send_id    = CmnXListUtil.IsNullStr(request.getParameter("v_user_name"));  //ID
    String v_recv_id    = CmnXListUtil.IsNullStr(request.getParameter("selHandlingUser"));  //ID
    String v_StartDate  = CmnXListUtil.IsNullStr(request.getParameter("StartDate"));
    String v_EndDate    = CmnXListUtil.IsNullStr(request.getParameter("EndDate"));

    String v_pro_id = CmnXListUtil.IsNullStr(request.getParameter("gsProId"));
    String v_initial_id = CmnXListUtil.IsNullStr(request.getParameter("gsInitialId"));
    String v_seq_no = CmnXListUtil.IsNullStr(request.getParameter("gsSeqNo"));
    

    String v_work_gubun   = unescape(CmnXListUtil.IsNullStrKor(request.getParameter("hdnWorkGubun")));
    String v_code         = CmnXListUtil.IsNullStr(request.getParameter("v_code"));
    String v_last         = CmnXListUtil.IsNullStr(request.getParameter("v_last"));
    String v_wf_line      = CmnXListUtil.IsNullStr(request.getParameter("v_wf_line"));
    String v_remark       = unescape(CmnXListUtil.IsNullStrKor(request.getParameter("v_remark")));
    String v_emp_id       = CmnXListUtil.IsNullStr(request.getParameter("txtEmpId"));
    String v_dept_id      = CmnXListUtil.IsNullStr(request.getParameter("gsKRDeptID"));

    //계산서 등록 페이지 결재 인지 확인(2일때 계산서 등록에서 들어온 결재임)
    String gsMode         = CmnXListUtil.IsNullStr(request.getParameter("gsMode"));

    String lsToDay        = CmnXListUtil.IsNullStr(request.getParameter("gsToDay"));
    String lsInfo09         = CmnXListUtil.IsNullStr(request.getParameter("gsInfo09"));
    // 2011-03-22
    String lsEntryGubun     = CmnXListUtil.IsNullStr(request.getParameter("lsEntryGubun"));
    
    String lsMode       = CmnXListUtil.IsNullStr(request.getParameter("lsMode"));     //일괄결재(AS) 조회인지, 결재 조회(TS)인지, 일괄 결재완료(ASE) 조회 인지 구분

    String lsYear       = CmnXListUtil.IsNullStr(request.getParameter("lsYear"));
    String lsOrderBy    = CmnXListUtil.IsNullStr(request.getParameter("orderby"));
    String lsCtNo   = CmnXListUtil.IsNullStr(request.getParameter("ctno"));

    String lsEntryCode  = CmnXListUtil.IsNullStr(request.getParameter("lsEntryCode")); //Entry Code
    String lsPostType   = CmnXListUtil.IsNullStr(request.getParameter("gsPostType"));  //부서구분
    
    String lsStatus = CmnXListUtil.IsNullStr(request.getParameter("gsstatus"));        //결재자 ID 구분

    String lsCont = CmnXListUtil.IsNullStr(request.getParameter("gsCont"));         //거래사
    
    String lsDetail = CmnXListUtil.IsNullStr(request.getParameter("lsDetaileMode"));  //해상부 결재 1. 보험료 2. 보험금
    String lsDeptCode = CmnXListUtil.IsNullStr(request.getParameter("lsDeptCode")); 
    
    String lsProId = CmnXListUtil.IsNullStr(request.getParameter("proid"));
    String lsSeqNo = CmnXListUtil.IsNullStr(request.getParameter("seqno"));
    String lsRecvId = CmnXListUtil.IsNullStr(request.getParameter("recvid"));

    String lsDummy1     = CmnXListUtil.IsNullStr(request.getParameter("dummy1"));
    String lsDummy2     = CmnXListUtil.IsNullStr(request.getParameter("dummy2"));
    String lsDummy3     = CmnXListUtil.IsNullStr(request.getParameter("dummy3"));
    String lsDummy4     = CmnXListUtil.IsNullStr(request.getParameter("dummy4"));
    String lsDummy5     = CmnXListUtil.IsNullStr(request.getParameter("dummy5"));
    String lsDummy9     = CmnXListUtil.IsNullStr(request.getParameter("dummy9"));
    String lsDummy10     = CmnXListUtil.IsNullStr(request.getParameter("dummy10"));

    String lsJobFlag    = CmnXListUtil.IsNullStr(request.getParameter("jobflag"));
    
    String lsIndex06    = CmnXListUtil.IsNullStr(request.getParameter("index06"));
    String lsInfo01     = CmnXListUtil.IsNullStr(request.getParameter("info01"));
    String lsInfo04     = CmnXListUtil.IsNullStr(request.getParameter("info04"));
    String lsInfo08     = CmnXListUtil.IsNullStr(request.getParameter("info08"));
    
    String lsBizDvCd        = CmnXListUtil.IsNullStr(request.getParameter("bizdvcd"));
    String lsImgCnt     = CmnXListUtil.IsNullStr(request.getParameter("imgcnt"));
    

    String lsChkMode10      = CmnXListUtil.IsNullStr(request.getParameter("chkmode10"));
    String lsChkMode20      = CmnXListUtil.IsNullStr(request.getParameter("chkmode20"));
    String lsChkMode30      = CmnXListUtil.IsNullStr(request.getParameter("chkmode30"));
    String lsChkMode40      = CmnXListUtil.IsNullStr(request.getParameter("chkmode40"));

    
    String lsSendId = CmnXListUtil.IsNullStr(request.getParameter("sendid"));
    String lsWorkGubun = CmnXListUtil.IsNullStr(request.getParameter("workgubun"));
    String lsCode = CmnXListUtil.IsNullStr(request.getParameter("code"));
    String lsRemark       = unescape(CmnXListUtil.IsNullStrKor(request.getParameter("remark")));
    String lsReason       = unescape(CmnXListUtil.IsNullStrKor(request.getParameter("reason")));
    String lsIndex03        = CmnXListUtil.IsNullStr(request.getParameter("index03"));
    String lsUserId     = CmnXListUtil.IsNullStr(request.getParameter("userid"));

    String lsSiteCd     = CmnXListUtil.IsNullStr(request.getParameter("sitecd"));
    
    String lsAprStatCd = "04";
           
    //20171017 NSA 조성은 사용자일 경우 상신자에 재물보험1팀 파트장를 추가로 보여줘야 하기 때문에 직책 파라미터 추가.. 이인준 대리님 요청사항 
    String lsPosId                     = CmnXListUtil.IsNullStr(request.getParameter("gsPosId"));
    
    
    UdpDSearch pUdpDSearch = new UdpDSearch();
    UdpDModify pUdpDModify = new UdpDModify();

    UdpBAfiInterFaceDAO pUdpBAfiInterFaceDAO = new UdpBAfiInterFaceDAO();
    
    System.out.println("lsGuBun : "+lsGuBun);
    HashMap pMap = new HashMap();

    ArrayList parmArr = new ArrayList();
    
    ArrayList rtnArr = new ArrayList();
    Map rtnMap = new HashMap();
    Map rtnMap00 = null;
    Map rtnMap01 = null;
    String rtnInt = "-1";
    
    if(lsGuBun.equals("WF_GetTreeList")){
        pMap = new HashMap();
        pMap.put("ENTRY_CODE", lsEntryCode);
        if(lsMode.equals("ASE")) {
            pMap.put("YEAR", lsYear);
        }
        pMap.put("SEND_ID", v_send_id);
        pMap.put("RECV_ID", v_send_id);
        pMap.put("SYS_DATE", v_StartDate);
        pMap.put("SYS_TIME", v_EndDate);
        pMap.put("AppMode", lsMode);
        pMap.put("ORDERBY", lsOrderBy);
        pMap.put("CTNO", lsCtNo);
        pMap.put("INFO09", lsPostType);
        pMap.put("INFO02", lsCont);
        pMap.put("INFO08", lsDetail);
        pMap.put("C_DEPT", lsDeptCode);
        pMap.put("MODE10", lsChkMode10);
        pMap.put("MODE20", lsChkMode20);
        pMap.put("MODE30", lsChkMode30);
        pMap.put("MODE40", lsChkMode40);
        pMap.put("LANG_GB", lsLangGb);
        
        try {
            pUdpDSearch = new UdpDSearch();
            rtnArr = pUdpDSearch.selectTotalBox(pMap);      //추후 구현 
            
            for(int i=0;i<rtnArr.size();i++) {
                rtnMap = (HashMap)rtnArr.get(i);
                out.print(rtnMap.get("WORK_GUBUN") + "|");  //
               out.print(rtnMap.get("PRO_ID") + "|");  //
                out.print(rtnMap.get("INDEX01") + "|"); //
                out.print(rtnMap.get("INDEX09") + "|"); //
                out.print(rtnMap.get("SEND_ID") + "|"); //
                out.print(rtnMap.get("RECV_ID") + "|"); //
                out.print(rtnMap.get("SYS_DATE") + "|");    //
                out.print(rtnMap.get("STATUS") + "|");  //
                out.print(rtnMap.get("INDEX05") + "|"); //
                out.print(rtnMap.get("CODE") + "|");    //
                out.print(rtnMap.get("REMARK") + "|");  //
                out.print(rtnMap.get("SEQNO") + "|");   //
                out.print(rtnMap.get("PAGE_CNT") + "|");    //
                out.print(rtnMap.get("SEND_NAME") + "|");   //
                out.print(rtnMap.get("INDEX03") + "|"); //
                out.print(rtnMap.get("INFO04") + "|");  //
                out.print(rtnMap.get("INFO02") + "|");  //
                out.print(rtnMap.get("INFO03") + "|");  //
                out.print(rtnMap.get("INFO09") + "|");  //
                out.print(rtnMap.get("INDEX02") + "|"); //
                out.print(rtnMap.get("INDEX04") + "|"); //
                out.print(rtnMap.get("INFO10") + "|");  //
                out.print(rtnMap.get("INFO06") + "|");  //
                out.print(rtnMap.get("INFO07") + "|");  //
                out.print(rtnMap.get("SCAN_NAME") + "^");   //
                

            }
        } catch(Exception e) {  //리스트 조회중 오류
            //out.print("Error");
            e.toString();
        }
    }else if(lsGuBun.equals("WF_GetInitialList")){

        pUdpDSearch = new UdpDSearch();
        pMap = new HashMap();
        rtnArr = new ArrayList();
                     
        pMap.put("DPT_ID", lsPostType);
        pMap.put("DUMMY3", lsDummy3);
        pMap.put("DUMMY4", lsDummy4);
        pMap.put("DUMMY5", lsDummy5);
        //20180409 NSA 글로벌 사업팀의 경우 결재선 라인에 두바이 지점 중간결재자가 보이지 않음. 글로벌 사업팀을 선택하였을 시, 두바이 지점 사람도 결재리스트 상에 나오도록 수정(이인준 대리님 요청)
        if(!lsPostType.equals("207000"))
        {
        pMap.put("DUMMY9", lsDummy9);
        }
        pMap.put("SITE_CD", lsSiteCd);
        
        pMap.put("STATUS", lsStatus);     //결재자 ID 구분값
        pMap.put("LANG_GB", lsLangGb);
        
        //20171017 NSA 조성은 사용자일 경우 상신자에 재물보험1팀 파트장를 추가로 보여줘야 하기 때문에 직책 파라미터 추가.. 이인준 대리님 요청사항 
        pMap.put("POS_ID", lsPosId);         // 직책 POI11 : 파트장

        try {
        // 문서목록 조회
            rtnArr = pUdpDSearch.selectWorkFlowInitialList(pMap);

            for (int i=0; i<rtnArr.size(); i++) {
                rtnMap = (HashMap)rtnArr.get(i);
                out.print(rtnMap.get("DUM_USR_ID")+"|");
                out.print(rtnMap.get("USR_FIRST_NAME")+"|");
                out.print(rtnMap.get("DPT_ID")+"^");
            }

        } catch(Exception e) {
            e.toString();
            out.println("Error");
        }
    }
    //jskim, get wf target
    else if(lsGuBun.equals("WF_GetTargetInfo")){

        pUdpDSearch = new UdpDSearch();
        pMap = new HashMap();
        rtnArr = new ArrayList();
        
        pMap.put("DUM_USR_ID", lsAfiUserId);
        
        try {
            // 문서목록 조회
            rtnArr = pUdpDSearch.selectWorkFlowInitialList(pMap);

            if(rtnArr.size()>0) {
                rtnMap = (HashMap)rtnArr.get(0);
                out.print(rtnMap.get("DUMMY1")+"|");
                out.print(rtnMap.get("DUMMY2")+"|");
                out.print(rtnMap.get("DUMMY10")+"^");       
            }
            else {
                   out.print("");
            }

        } catch(Exception e) {
            e.toString();
            out.println("Error");
        }
    }
    //jskim, set wf target
    else if(lsGuBun.equals("WF_SetTargetInfo")){

        pUdpDModify = new UdpDModify();
        pMap = new HashMap();
        rtnArr = new ArrayList();

        pMap.put("DUM_USR_ID", lsAfiUserId);
        if(lsDummy10.equals("2")) {
            pMap.put("DUMMY1", lsDummy1);                 
        } else if(lsDummy10.equals("3")) {
            pMap.put("DUMMY2", lsDummy2);                 
        }
        pMap.put("DUMMY10", lsDummy10);
        
        try {
            // 문서목록 조회
                                int liRtn = pUdpDModify.setWfTarget(pMap);

            out.print(liRtn);

        } catch(Exception e) {
            e.toString();
            out.println("Error");
        }
    }else if(lsGuBun.equals("WF_ApprovalCancel")){

        pUdpDModify = new UdpDModify();
        pMap = new HashMap();
        rtnArr = new ArrayList();

        pMap.put("PRO_ID", v_pro_id);
        pMap.put("RECV_ID", v_initial_id);
        pMap.put("SEQ1_SEND_ID", lsSendId);
        pMap.put("SEQNO", v_seq_no);
        pMap.put("C_DEPT", lsPostType);
        
        pMap.put("lginIpAdr", lsLocalIp);
        pMap.put("userId", lsAfiUserId);
        
        // 2011-03-22
        if(lsPostType.equals("302000")&&lsEntryGubun!=""){
            pMap.put("INDEX10", lsEntryGubun);
        }   
        
        System.out.println("[SUMMONLOG] PRO_ID,RECV_ID,SEQNO, C_DEPT : "+v_pro_id+","+v_initial_id+","+v_seq_no+","+lsPostType);
        System.out.println("lsEntryGubun  ==========> "+lsEntryGubun);

        
        try {
            // 문서목록 조회
            rtnInt = pUdpDModify.cancelWorkFlowLine(pMap);
            System.out.println("[SUMMONLOG] rtnInt : "+rtnInt);
            out.print(rtnInt);

        } catch(Exception e) {
            e.toString();
            out.println("Error");
        }
    }else if(lsGuBun.equals("WF_RemarkUpdate")){

        int rtnInt2 = -1;
        pMap = new HashMap();
        System.out.println(lsProId);
        System.out.println(lsRecvId);
        System.out.println(lsSeqNo);
        pMap.put("PRO_ID", lsProId);
        pMap.put("RECV_ID", lsRecvId);
        pMap.put("SEQNO", lsSeqNo);
        
        try {
            rtnInt2 = pUdpDModify.setRemarkStatus(pMap);
        } catch(Exception e) {
            e.toString();
            out.println("Error");
        }
        if(rtnInt2 < 1){
            out.print("Unknown error. Contact administrator.");
        }else{
            out.print("success");
        }
    }else if(lsGuBun.equals("WF_ImgDelete")){
        pMap = new HashMap();
        pMap.put("PRO_ID", lsProId);
        
        int resultInt = pUdpDModify.delImgProfile(pMap);
            
        if(resultInt < 1){
            out.print("Unknown error. Contact administrator.");
        }else{
            out.print("success");       
        }
    }else if(lsGuBun.equals("WF_Registration")){

        pMap = new HashMap();
        System.out.println("####### WF_Registration : PRO_ID, SEND_ID, RECV_ID : ["+v_pro_id+"]["+lsInfo04+"]["+v_recv_id+"]");
        pMap.put("PRO_ID", v_pro_id);
        pMap.put("WORK_GUBUN", v_work_gubun);
        pMap.put("SEND_ID", lsInfo04);
        pMap.put("RECV_ID", v_recv_id);
        if(v_remark.equals("")){
            pMap.put("CODE", "N");
        }else{
            pMap.put("CODE", "Y");
        }
        pMap.put("INDEX07", v_wf_line);
        pMap.put("REMARK", v_remark);
        pMap.put("LAST_MAN", v_last);
        pMap.put("C_DEPT", lsPostType);
        pMap.put("INDEX06", lsIndex06);
        pMap.put("INFO01", lsInfo01);
        pMap.put("INFO04", lsInfo04);
        pMap.put("INFO08", lsInfo08);
        
        pMap.put("BIZ_DV_CD", lsBizDvCd);
        pMap.put("IMG_CNT", lsImgCnt);
        
        pMap.put("lginIpAdr", lsLocalIp);
        pMap.put("userId", lsAfiUserId);
        
        //20141007 mack
         //결재상황이 kr실업담당자 =>kr실업최고결재자인 경우 info01 = 999999 를 넣어야 통계에서 kr실업 건이 집계된다
         if(ssKRDptCode.equals("999999")&&!ssC_APP.equals("Y")) { 
            pMap.put("INFO01", "999999");
        }
        
        String resultInt = "0";
        //20141121 mack 결제자 아이디 넘어오지 않았으면  오류처리한다       
        if(v_recv_id==null || "".equals(v_recv_id.trim()))
        {
            resultInt = "-998";
        } else {
            //20140924 mack 결제정보 입력 중복체크
            int liDupCnt = pUdpDModify.selectApprovalDupCnt(pMap);
            
            System.out.println("####### duplication check  ["+liDupCnt+"] ##########################");
            if(liDupCnt > 0 ) {
                resultInt = "-999";
            } else { //중복이 아닌경우에만 결제가 진행됨
                resultInt = pUdpDModify.insertApproval(pMap);
            }
        }
        out.print(resultInt);   
        
    }else if(lsGuBun.equals("WF_ReturnRegistration")){

        pMap = new HashMap();
        
        if(ssKRDptCode.equals(lsInfo09)&&ssC_APP.equals("Y")){ //외국부, 최고 결재자
            //반려중
            lsIndex06 = "30";
            lsInfo01 = lsInfo09;
        }else if(ssKRDptCode.equals("999999")&&ssC_APP.equals("Y")){  //kr실업, 최고결재자
                lsAprStatCd = "01";
        //20170207 - srpark : 중간결재자가 생겨 Index06값을 30으로 변경함
//             lsIndex06 = "20";
            lsIndex06 = "30";
            lsInfo01 = "999999";
        }else if(ssKRDptCode.equals(lsInfo09)&&!ssC_APP.equals("Y")){  //외국부, 중간결재자
            if(lsIndex03.equals(lsInfo09)) {  //최초 등록한 처리과가 외국부일때
                lsAprStatCd = "01";
                lsIndex06 = "20";
                lsInfo01 = lsInfo09;
            } else if(lsIndex03.equals("999999")) { //최초 등록한 처리과가 KR실업일때
                lsIndex06 = "30";
                lsInfo01 = "999999";
            }
        //반려중
        }
        else if(ssKRDptCode.equals("999999")&& !ssC_APP.equals("Y")){  //kr실업, 최초 등록자
            //반려중
            lsAprStatCd = "01";
            lsIndex06 = "20";
            lsInfo01 = "999999";
        }
        if(lsRemark.equals("")){
            lsCode = "N";
        }else{
            lsCode = "Y";
        }
        pMap.put("PRO_ID", lsProId);
        pMap.put("SEND_ID", lsSendId);
        pMap.put("WORK_GUBUN", "9");        //반려중
        pMap.put("RECV_ID", lsRecvId);
        pMap.put("CODE", lsCode);
        pMap.put("REMARK", lsRemark);
        pMap.put("REASON", lsReason);
        
        pMap.put("INDEX06", lsIndex06);
        pMap.put("INFO01", lsInfo01);

        pMap.put("BIZ_DV_CD", lsBizDvCd);
        pMap.put("IMG_CNT", lsImgCnt);
        pMap.put("APR_STAT_CD", lsAprStatCd);
        
        pMap.put("lginIpAdr", lsLocalIp);
        pMap.put("userId", lsAfiUserId);
        String resultInt = pUdpDModify.insertReturn(pMap);
        out.print(resultInt);   
        
    }else if(lsGuBun.equals("WF_GetAllApprovalList")){
        String id="MSG0000876";
        String serviceid="SVC0000456";

        ArrayList reqList = new ArrayList();
        String laProId[] = lsProId.split("[|]");
        for(int i=0; i<laProId.length; i++){
            System.out.println(laProId[i]);
            rtnMap = new HashMap();
            rtnMap.put("imgId", laProId[i]);
            reqList.add(rtnMap);
        }
        pMap.put("ImgIdList", reqList);

        pMap.put("value", "CbDocMngbAprTrgInqyReqs");
        //CbImgAprTrgInqyReqs
        pMap.put("lginIpAdr", lsLocalIp);
        pMap.put("userId", lsAfiUserId);
        
        rtnMap = pUdpBAfiInterFaceDAO.getSendRequest(pMap, id, serviceid);
        System.out.println("rtnMap : "+rtnMap);
        rtnMap00 = (HashMap)rtnMap.get("CbDocMngbAprTrgInqyRsp");
        rtnArr = (ArrayList)rtnMap00.get("saAprTrgList");
        for(int i=0; i<rtnArr.size(); i++){
            rtnMap01 = (Map)rtnArr.get(i);
            System.out.println("rtnMap01 : "+rtnMap01);
            out.print(rtnMap01.get("imgId")+"|");
            out.print(rtnMap01.get("gdCd")+"|");
            out.print(rtnMap01.get("prcsEmpNo")+"|");
            out.print(rtnMap01.get("ldcoCd")+"|");
            out.print(rtnMap01.get("plcyNo")+"|");
            out.print(rtnMap01.get("ttyYrmm")+"|");
            out.print(rtnMap01.get("lsdt")+"|");
            out.print(rtnMap01.get("colCd")+"|");
            out.print(rtnMap01.get("acdnPlcCd")+"|");
            out.print(rtnMap01.get("prssDvCd")+"|");
            out.print(rtnMap01.get("curCd")+"|");
            out.print(rtnMap01.get("orgCla")+"|");
            out.print(rtnMap01.get("iwdCla")+"|");
            out.print(rtnMap01.get("imgFileStNo")+"|");
            out.print(rtnMap01.get("imgFileEndNo")+"|");
            out.print(rtnMap01.get("ctrNm")+"|");
            out.print(rtnMap01.get("acDvCd")+"|");
            out.print(rtnMap01.get("insStDt")+"|");
            out.print(rtnMap01.get("insEndDt")+"|");
            out.print(rtnMap01.get("orgPre")+"|");
            out.print(rtnMap01.get("iwdPre")+"|");
            out.print(rtnMap01.get("com")+"|");
            out.print(rtnMap01.get("appYrmm")+"|");
            out.print(rtnMap01.get("saOcrnSno")+"|");
            out.print(rtnMap01.get("ctNm")+"|");
            out.print(rtnMap01.get("ctYy")+"|");
            out.print(rtnMap01.get("fy")+"|");
            out.print(rtnMap01.get("saOcrnCycCd")+"|");
            out.print(rtnMap01.get("preTta")+"|");
            out.print(rtnMap01.get("comTta")+"|");
            out.print(rtnMap01.get("preBal")+"|");
            out.print(rtnMap01.get("cla")+"|");
            out.print(rtnMap01.get("ntbl")+"|");
            out.print(rtnMap01.get("pfcom")+"|");
            out.print(rtnMap01.get("prrsCf")+"|");
            out.print(rtnMap01.get("prrsRls")+"|");
            out.print(rtnMap01.get("lsresCf")+"|");
            out.print(rtnMap01.get("lsresRls")+"|");
            out.print(rtnMap01.get("osl")+"|");
            out.print(rtnMap01.get("cas")+"|");
            out.print(rtnMap01.get("ctNo")+"|");
            out.print(rtnMap01.get("cdnNm")+"|");
            out.print(rtnMap01.get("epiCtsActPreRto")+"|");
            out.print(rtnMap01.get("epiClcRmk")+"|");
            out.print(rtnMap01.get("osl2")+"^");
        }
    }else if(lsGuBun.equals("WF_AllRegistration")){
        
        String laProId[] = v_pro_id.split("[|]");
        String laImgCnt[] = lsImgCnt.split("[|]");
        String laInfo01[] = lsInfo01.split("[|]");
        
        for(int i=0; i<laProId.length; i++){
            if(!laProId[i].equals("")){
                pMap = new HashMap();
                System.out.println("####### WF_AllRegistration : PRO_ID, SEND_ID, RECV_ID : ["+laProId[i]+"]["+lsInfo04+"]["+v_recv_id+"]");
                pMap.put("PRO_ID", laProId[i]);
                pMap.put("WORK_GUBUN", v_work_gubun);
                pMap.put("SEND_ID", lsInfo04);
                pMap.put("RECV_ID", v_recv_id);
                pMap.put("CODE", "N");
                pMap.put("REMARK", "");
                pMap.put("LAST_MAN", v_last);
                pMap.put("C_DEPT", lsPostType);
                pMap.put("INDEX06", lsIndex06);
                pMap.put("INFO01", laInfo01[i]);
                pMap.put("INFO04", lsInfo04);
                pMap.put("INFO08", lsInfo08);
                
                pMap.put("BIZ_DV_CD", lsBizDvCd);
                pMap.put("IMG_CNT", laImgCnt[i]);
                
                pMap.put("lginIpAdr", lsLocalIp);
                pMap.put("userId", lsAfiUserId);
                
                String resultInt = "0";
                //20141202 mack 결제자 아이디 넘어오지 않았으면  오류처리한다       
                if(v_recv_id==null || "".equals(v_recv_id.trim()))
                {
                    resultInt = "-998";
                    out.print(laProId[i]+"|"+resultInt+"^");
                } else {
                    //20140924 mack 결제정보 입력 중복체크
                    int liDupCnt = pUdpDModify.selectApprovalDupCnt(pMap);
                    
                    System.out.println("####### duplication check  ALL  ["+liDupCnt+"] ##########################");
                    if(liDupCnt > 0 ) {
                        //resultInt = -999;
                        //결제정보가 중복인경우에는 아무것도 리턴하지 않고 넘어간다
                    } else { //중복이 아닌경우에만 결제가 진행됨
                        resultInt = pUdpDModify.insertApproval(pMap);
                        out.print(laProId[i]+"|"+resultInt+"^");
                    }
                }               
            }
                
        }
    }else if(lsGuBun.equals("WF_AllReturnRegistration")){

        String laProId[] = lsProId.split("[|]");
        String laImgCnt[] = lsImgCnt.split("[|]");
        String laInfo01[] = lsInfo01.split("[|]");
        String laInfo09[] = lsInfo09.split("[|]");
        String laRecvId[] = lsRecvId.split("[|]");
        String laIndex03[] = lsIndex03.split("[|]");
        
        for(int i=0; i<laProId.length; i++){
            if(!laProId[i].equals("")){
                pMap = new HashMap();
                pMap.put("PRO_ID", laProId[i]);
                pMap.put("RECV_ID", lsUserId);
                //결재 라인 조회
                rtnArr = pUdpDSearch.selectWorkFlowReturnInfo(pMap);


                lsSendId = lsAfiUserId; //결재 라인이 없을경우 현재 사람이 최초 등록자가 됨!
    
                if(ssKRDptCode.equals(laInfo09[i])&&ssC_APP.equals("Y")){ //외국부, 최고 결재자
                    //반려중
                    lsIndex06 = "30";
                    lsInfo01 = laInfo09[i];
                }else if(ssKRDptCode.equals("999999")&&ssC_APP.equals("Y")){  //kr실업, 최고결재자
                    lsAprStatCd = "01";
                    lsIndex06 = "20";
                    lsInfo01 = "999999";
                }else if(ssKRDptCode.equals(laInfo09[i])&&!ssC_APP.equals("Y")){  //외국부, 중간결재자
                    if(lsIndex03.equals(laInfo09[i])) {  //최초 등록한 처리과가 외국부일때
                        lsAprStatCd = "01";
                        lsIndex06 = "20";
                        lsInfo01 = laInfo09[i];
                    } else if(laIndex03[i].equals("999999")) { //최초 등록한 처리과가 KR실업일때
                        lsIndex06 = "30";
                        lsInfo01 = "999999";
                    }
                //반려중
                }else if(ssKRDptCode.equals("999999")&&!ssC_APP.equals("Y")){  //kr실업, 최초 등록자
                    //반려중
                    lsAprStatCd = "01";
                    lsIndex06 = "20";
                    lsInfo01 = "999999";
                }
                if(lsRemark.equals("")){
                    lsCode = "N";
                }else{
                    lsCode = "Y";
                }
                
                pMap.put("PRO_ID", laProId[i]);
                pMap.put("SEND_ID", lsSendId);
                pMap.put("WORK_GUBUN", "9");        //반려중
                pMap.put("RECV_ID", laRecvId[i]);
                pMap.put("CODE", lsCode);
                pMap.put("REMARK", lsRemark);
                pMap.put("REASON", lsReason);
                
                pMap.put("INDEX06", lsIndex06);
                pMap.put("INFO01", lsInfo01);
        
                pMap.put("IMG_CNT", laImgCnt[i]);
                pMap.put("APR_STAT_CD", lsAprStatCd);
                
                pMap.put("lginIpAdr", lsLocalIp);
                pMap.put("userId", lsAfiUserId);
                
                System.out.print("jhkang : "+pMap); 
                String resultInt = pUdpDModify.insertReturn(pMap);
                out.print(resultInt);   
            }
            
        }
    }else if(lsGuBun.equals("WF_ApprovalCheck")){
        
        pMap.put("PRO_ID", lsProId);
        pMap.put("SEND_ID", lsAfiUserId);
        
        int resultInt = 1;

        try {
            // 문서목록 조회
            resultInt = pUdpDSearch.approvalCheck(pMap);

        } catch(Exception e) {
            e.toString();
            out.println("-9");
        }

        out.print(resultInt);   
        
    }
    
%>
