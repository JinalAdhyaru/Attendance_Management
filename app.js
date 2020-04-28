var express= require('express');
var bodyParser= require('body-parser');
var mysql = require('mysql');
var session = require('express-session');
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


app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());
app.set('view engine', 'ejs');

app.get("/", function(req, res) {
    res.sendFile(path.join(__dirname + "/views/index.html"));
});

var obj = {};
var obj3 = {};
app.post("/auth", function (request, response) {
    var userid = request.body.usrname;
    var password = request.body.password;

    //console.log(userid);
    //console.log(password);
    if (userid.includes("2018500")) {
        //console.log("entered student");
        var sqls = 'SELECT * FROM student WHERE sid = ? AND spaswrd = ?';
        connection.query(sqls, [userid, password], function (err, result) {
        if (err) throw err;
        if(result.length==0)
        {
            response.send("student not found");
        }
        else{
        //console.log("found student");
        connection.query("select sname from student where sid= '"+ userid + "'", function (err,result1) {   
            if (err) throw err;
            if(result1.length == 0) {
                response.send("error");
            }
            else {
               // console.log(result1);
               response.render('student',{studentname: result[0].sname});
            }

      });
      
        }
    });
    }
    else if (userid.includes("F")) {
        // console.log("entered faculty");
        var sqlf = 'SELECT * FROM faculty WHERE fid = ? AND fpaswrd = ?';
    connection.query(sqlf, [userid, password], function (err, result) {
        if (err) throw err;
        if(result.length == 0)
        {
            response.send("faculty not found");
        }
        else{
            connection.query("select fname from faculty where fid = '"+ userid +"'", function(err,result2) {
                if(err) throw err;
                if(result2.length == 0)
                {
                    response.send("no such faculty");
                }
                else {
                    //console.log(result2);
                    connection.query("SELECT course.cname FROM course natural join faculty where fid = '"+ userid + "'", function (err, result1) {
                        if (err) throw err;
                        //console.log(f);  
                        if(result1.length==0)
                        {
                        response.send("no course");
                        }           
                      else {
                          //console.log(result1);
                          obj.facname = result2;
                          obj.users = result1;
                          response.render('home',obj);                
                      }
                    });            
                }
            });          
        }        
    });
    }
    else {
        response.send("incorrect values");
    }
    
});

var obj2={};
// app.post('/mark', function(req,res) {
//     var subject = req.body.addattendance;
//     console.log("The subject selected for adding attendance is "+ subject);
//     connection.query("select course.cid, course.cname , faculty.fid , faculty.fname, student.sid from student, course natural join faculty where cname = '" + subject + "'", function(err,result) {
//     console.log("The result of the query inside post mark is:" + result);
//     obj2 = {attend: result};
//     console.log("This is inside post mark : " + obj2);
//     for(var i=0;i<obj2.length;i++) {
//         console.log(obj2[i].cid + " " + obj2[i].cname + " "+obj[i].fid + " " + obj[i].fname +" " + obj[i].sid +"\n");
//     } 
//     res.render('attend',obj2);
//     })       
       
// });
app.post('/mark',function(request,response){
    var sub = request.body.addattendance;
    console.log(sub);
    var sqlq='select student.sid,student.sname,course.cid,course.cname,faculty.fid,faculty.fname from course natural join faculty,student where cname=?';
    connection.query(sqlq,[sub],function(err,result){
        if(err) throw err;
        if(result.length==0){
            response.send("no record found");
        }
        else{
            console.log(result);
            obj2 = {attend: result};
            console.log(obj2);
            response.render('attend',obj2);

        }
    });
});

app.post('/lastpage', function (req, res) {    
    const d = new Date();
    const ye = new Intl.DateTimeFormat('en', { year: 'numeric' }).format(d)
    const mo = new Intl.DateTimeFormat('en', { month: 'long' }).format(d)
    const da = new Intl.DateTimeFormat('en', { day: 'numeric' }).format(d)

    var dayy = `${da}_${mo}_${ye}`;
    //console.log(dayy);
    var attended = req.body.selectpick;
    var sids = req.body.sid;
    var cid = req.body.cid;
    var cn = cid + "_attendance";
    // var fid = request.body.fid;
    console.log(sids.length);
    console.log(sids);
    console.log(attended);
    console.log(cn);
    console.log(dayy);
    connection.query("alter table " + cn + " add column" + dayy + " varchar(1)" , function(err, result) {
        if (err) throw err;
        if(result.length == 0)
        {
            console.log("column added successfully");
        }
        else {
            for (var i = 0; i < sids.length; i++) {
                var atsql = "update " + cn + " set " + dayy + " = '?' where sid = '?'" ;
                connection.query(atsql, [attended[i]] , sids[i], function (err, result) {
                    if (err) throw err;
                    console.log("record inserted successfully");
                    console.log(result);
                });        
            }
        }
    });
});


var obj4 = {};
app.post('/fview',function(request,response){
    var crs = request.body.viewatt;
    console.log("ur subject is taken" + crs);
    var viewquery = "select cid from course where cname = '"+crs+"'";
    connection.query(viewquery,[crs],function(err,result){
        if (err) throw err;
        if (result.length == 0) {
            response.send("no attendance found");
        }
        else {
            var x = result;
            var tbname = result[0].cid+"_attendance";
            // connection.query("select course.cid,course.cname,stu from "+ tbname +"", function(err,result) {
            //     if (err) throw err;
            //     if(result.length == 0) { console.log("table does not exist")}
            //     else {
            //         console.log(result);    
            //         obj4 = { fview: result };
            //         response.render('fview', obj4);                                   
            //     }
            // })   
            connection.query("show column_names from "+ tbname +".columns", function(err,result) {
                if (err) throw err;
                    if(result.length == 0) { console.log("table does not exist")}
                    else {
                        console.log(result);                                       
                    }
            })
        }
    });
});


app.post('/attendance', function (request, response) {
    console.log(request.body.selectpick);
    var crname = request.body.selectpick;
    var stdn = request.body.studentname;
    console.log(crname);
    connection.query("select cid from course where cname = '" + crname + "'", function(err, result) {
        if (err) throw err;
        if(result.length == 0) { console.log("Course does not exist")}
        else {
            console.log(result);
            var x = result;
            var tbname = result[0].cid + "_attendance";
            console.log(stdn);
            console.log(tbname);
            connection.query("show columns from "+ tbname, function(err,result) {
                if (err) throw err;
                if(result.length == 0) { console.log("table does not exist")}
                else {
                    console.log(result);
                                                                                
                }
            })   
        }
    })   
});

app.listen(3000, function () {
    console.log("Server started on port 3000");
});

