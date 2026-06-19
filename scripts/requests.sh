#!/usr/bin/env bash

get_issues() {
  local jql=$1
  curl --get \
    --url "https://$TEST_JIRA_DOMAIN/rest/api/3/search/jql" \
    --data-urlencode "jql=$jql" \
    --data-urlencode 'fields=summary' \
    -u "$TEST_JIRA_EMAIL:$TEST_JIRA_API_KEY" \
    -H "Accept: application/json" \
    -s | jq '.'
}

case $1 in
  work)
    case $2 in
      began)
        get_issues 'assignee = currentUser() AND status changed TO "In Progress" AFTER startOfDay() AND status = "In Progress"'
        ;;
      progress)
        get_issues 'assignee = currentUser() AND status = "In Progress" AND sprint in openSprints()'
        ;;
      pr)
        get_issues 'assignee = currentUser() AND status changed TO "pr" AFTER startOfDay() AND status = "pr"'
        ;;
      done)
        get_issues 'assignee = currentUser() AND status changed TO "Done" AFTER startOfDay() AND status = "Done"'
        ;;
      *)
        echo "Uknown argument: $2"
        ;;
    esac
    ;;
  sheet)
    case $2 in
      auth)
        curl -X POST "https://$WARP_TEST_DOMAIN/api/account/authorise" \
          -H "Content-Type: application/json" \
          -d "{\"Email\": \"$WARP_TEST_USERNAME\", \"Password\": \"$WARP_TEST_PASSWORD\"}" \
          -s | jq '.'
        ;;
      projects)
        curl --get \
          --url "https://$WARP_TEST_DOMAIN/api/Project?per_page=500&page=$4" \
          -H "Authorization: Bearer $3" \
          -s | jq '.'
        ;;
      person)
        curl --get \
          --url "https://$WARP_TEST_DOMAIN/api/users/me" \
          -H "Authorization: Bearer $3" \
          -s | jq '.'
        ;;
      post)
        curl -X POST "https://$WARP_TEST_DOMAIN/api/entry/create" \
          -H "Content-Type: application/json" \
          -H "Authorization: Bearer $3" \
          -d @- <<-EOF
					{
					  "TaskId": "$3",
					  "PersonId": "$4",
					  "CostCodeId": "$5",
					  "DepartmentId": "1",
					  "Overtime": "$6",
					  "Time": "$7",
					  "EntryDate": "$8",
					  "Comments": "$9",
					  "WorkLogId": "0",
					  "Audited": "0"
					}
					EOF
        ;;
      *)
        ;;
    esac
    ;;
  api)
    curl --get \
      --url "http://localhost:3000/work/commit" | jq '.'
    ;;
  *)
    echo "Unknown argument: $1"
    ;;
esac
