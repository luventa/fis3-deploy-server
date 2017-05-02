APP_HOME=$(echo `pwd` | sed 's/\/bin//')
SERVER_PATH=$APP_HOME
LOG_PATH=$APP_HOME/log

case "$1" in

  start)
    echo "Strating server now ..."
    sleep 1
    cd $SERVER_PATH
    nohup npm run start >> $LOG_PATH/server.log 2>&1 &
    echo "Web server started."
    ;;

  stop)
    echo "Stopping server now ..."
    kill -9 ` ps -ef | grep "node fdp_server.js" | grep -v grep | awk '{print $2,$3}' ` >> $LOG_PATH/server_mgnt.log 2>&1 &
    sleep 1
    echo "Web server stopped."
    ;;

  restart)
    $0 stop
    sleep 1
    $0 start $2
    ;;

  *)
    echo "Usage: erver.sh {start|stop|restart}"
    ;;

esac

exit 0