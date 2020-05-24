var express= require('express');
var bodyParser= require('body-parser');
var mysql = require('mysql');
var session = require('express-session');
const passport = require("passport");
var path = require('path');

var connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'password',
    database: 'attendance_management'
});

var app = express();

app.use(session({
    secret: 'secret',
    resave: true,
    saveUninitialized: true
}));

app.use(passport.initialize());
app.use(passport.session());


app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());
app.set('view engine', 'ejs');
app.use(express.static("public"));

app.get("/", function(req, res) {
    res.sendFile(path.join(__dirname + "/views/index.html"));
});

app.get("/faculty", function(req,res){
    res.render("faculty");
});


app.get("/logout",function(req,res){
    req.logout();
    res.redirect("/");
});

app.get("/errors",function(req,res){
    res.redirect("/");
});


var obj = {};
app.post("/login", function (request, response) {
    var username = request.body.username;
    var password = request.body.password;
    if (username.includes("2018500")) {
        connection.query("select * from student where sid= '"+ username +"' and spaswrd = '"+ password+"'", function(err,result) {
            if (err) throw err;
            if(result.length==0) { response.render("errors",{message: "Student not found."}); }
            else{
                connection.query("select sname from student where sid= '"+ username + "'", function (err,result2) {   
                    if (err) throw err;
                    if(result2.length == 0) { response.render("errors",{message: "Student not found."}); }
                    else {
                        connection.query("select course.cname from std_course natural join course natural join student where sid='"+ username + "'", function (err, result1) {
                            if (err) throw err;
                            if(result1.length==0) { response.render("errors",{message: "No course found."}); }           
                            else {
                                obj.sname = result2;
                                obj.courses = result1;
                                response.render('student',obj);                
                            }
                        });    
                    }
                });      
            }
        });
    }
    else if (username.includes("F")) {
        connection.query("select * from faculty where fid= '"+ username +"' and fpaswrd = '"+ password+"'", function(err,result) {
            if (err) throw err;
            if(result.length == 0) {  response.render("errors",{message: "Faculty not found."}); }
            else {
                connection.query("select fname from faculty where fid = '"+ username +"'", function(err,result2) {
                    if(err) throw err;
                    if(result2.length == 0) { response.render("errors",{message: "Faculty not found."}); }
                    else {
                        connection.query("select course.cname from course natural join faculty where fid = '"+ username + "'", function (err, result1) {
                            if (err) throw err;
                            if(result1.length==0) { response.render("errors",{message: "No course found."}); }           
                            else {
                                obj.facname = result2;
                                obj.courses = result1;
                                response.render('faculty',obj);                
                            }
                        });            
                    }
                });          
            }        
        });
    }
    else { response.render("errors",{message: "The values you entered are incorrect.Please try again."});  }
});



var obj2={};
app.post('/addattendance',function(request,response){
    var subject = request.body.choosesubject;
    connection.query("select std_course.sid,student.sname,std_course.cid,course.cname,faculty.fid,faculty.fname from std_course natural join faculty natural join student natural join course where course.cname='"+subject+"'",function(err,result){
        if(err) throw err;
        if(result.length==0){ response.render("Finalpage",{message: "No such record exists."}); }
        else{
           obj2 = {data: result};
           response.render('attendancepage',obj2);
        }
    });
});

app.post('/addingattendance', function (req, res) {    
    const d = new Date();
    const ye = new Intl.DateTimeFormat('en', { year: 'numeric' }).format(d);
    const mo = new Intl.DateTimeFormat('en', { month: 'long' }).format(d);
    const da = new Intl.DateTimeFormat('en', { day: 'numeric' }).format(d);    
    var dayy = `${da}_${mo}_${ye}`;
    var attended = req.body.markattendance;
    var sids = req.body.sid;
    var cid = req.body.cid.toLowerCase();
    var cn = cid + "_attendance";
    var arrclname = [];
    var flag = 0;
    connection.query("show columns from "+ cn, function(err,columns) {
        if(err) throw err;
        else if(columns.length == 0) { response.render("Finalpage",{message: "The requested data does not exists."});  }
        else {
            for(var i=0;i<columns.length;i++) {
                arrclname.push(columns[i].Field);
                if(arrclname[i] == dayy) {
                    flag = 1; 
                    res.render("Finalpage",{message: "The attendance for current date is already recorded.Thus this cannot be recorded."});
                }
            }
        } 
        if(flag == 0) {
            connection.query("alter table " + cn + " add column " + dayy +" varchar(1)",function(err,result) {
            if(err) throw err;
            for(var i=0;i<sids.length;i++)
            {
                connection.query("update "+ cn + " set " + dayy + " = '" + attended[i] +"' where sid='"+ sids[i]+"'",function(err,result) {
                    if(err) throw err;      
                });
            }
            res.render("Finalpage",{message: "The attendance has been successfully recorded and stored in the database."});
            });
        }      
    });    
});
    
app.post('/viewattendance',function(request,response){
    var arrclname = [];
    var arr = [];
    var arrsname = [];
    var crs = request.body.choosesubject;
    connection.query("select cid from course where cname = '" + crs + "'",function(err,result){
        if (err) throw err;
        if (result.length == 0) { response.render("Finalpage",{message: "No such record exists."}); }
        else {
            connection.query("select cid,cname,fid,fname from course natural join faculty where cid='"+ result[0].cid + "'", function(err,data) {
                if(err) throw err;
                else if(data.length == 0) {console.log("Incorrect entry");}
                else {
                    arr.push(data[0].cid);
                    arr.push(data[0].cname);
                    arr.push(data[0].fid);
                    arr.push(data[0].fname);
                }
            });
            connection.query("select student.sname from student natural join std_course where std_course.cid = '"+ result[0].cid + "'",function(err,snames) {
                if(err) throw err;
                else if(snames.length == 0) { response.render("Finalpage",{message: "The requested data does not exists."});}
                else {
                    for(var i=0;i<snames.length;i++) {
                        arrsname.push(snames[i].sname);
                    }
                }
            });
            var tbname = result[0].cid+"_attendance";                           
            connection.query("show columns from "+ tbname, function(err,columns) {
                if(err) throw err;
                else if(columns.length == 0) { response.render("Finalpage",{message: "The requested data does not exists."});  }
                else {
                    for(var i=0;i<columns.length;i++) {
                        arrclname.push(columns[i].Field);
                    }
                    connection.query("select * from " + tbname , function(err,results) {
                        if(err) throw err;
                        else if(results.length == 0) {  response.render("Finalpage",{message: "The requested data does not exists."}); } 
                        else { response.render("facultyattendanceview" ,{studentnm: arrsname,data: arr,cols: arrclname,info: results});   }
                    });
                }       
            });                   
        }
    });
});

app.post('/student', function (request, response) {
    var arrclname = []; 
    var arr=[];
    var sid;
    var crname = request.body.choosesubject;
    var stdn = request.body.studentname;
    connection.query("select sid from student where sname = '" + stdn + "'", function(err,sids) {
        if(err) throw err;
        else if(sids.length == 0) {
            response.render("Finalpage",{message: "The requested data does not exists."});
        }
        else {
            sid = sids[0].sid;
        }
    });        
    connection.query("select cid from course where cname = '" + crname + "'", function(err, result) {
        if (err) throw err;
        if(result.length == 0) {response.render("Finalpage",{message: "The requested data does not exist."}); }
        else {
            connection.query("select cid,cname,fid,fname from course natural join faculty where cid='"+ result[0].cid +"'", function(err,data) {
                if(err) throw err;
                else if(data.length == 0) {response.render("Finalpage",{message: "The requested data does not exists."});}
                else {
                    arr.push(data[0].cid);
                    arr.push(data[0].cname);
                    arr.push(data[0].fid);
                    arr.push(data[0].fname);
                }
            });
            connection.query("select sname from student where sid='"+ sid +"'", function(err,nameofstudent) {
                if(err) throw err;
                else if(nameofstudent.length == 0) {response.render("Finalpage",{message: "The requested data does not exists."});}
                else {
                    arr.push(nameofstudent[0].sname);
                }
            });
            var x = result[0].cid;
            var tbname = x.toLowerCase() + "_attendance";
            connection.query("show columns from "+ tbname, function(err,columns) {
                if(err) throw err;
                else if(columns.length == 0) {response.render("Finalpage",{message: "The requested data does not exists."});  }
                else {
                    for(var i=0;i<columns.length;i++) {
                        arrclname.push(columns[i].Field);
                    }
                    connection.query("select * from " + tbname + " where sid = '" + sid + "'", function(err,results) {
                        if(err) throw err;
                        else if(results.length == 0) { response.render("Finalpage",{message: "The requested data does not exists."}); } 
                        else {                       
                            response.render("studentattendance" ,{data: arr,cols: arrclname,info: results});
                        }
                    });
                }       
            });
        }
    });   
});

app.listen(3000, function () {
    console.log("Server started on port 3000");
});

