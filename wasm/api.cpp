#include <boost/json/src.hpp>
#include <emscripten.h>
#include <rime_api.h>
#include <string>

#define APP_NAME "rime.react"

namespace rime_react {

RimeTraits traits = {0};
RimeSessionId session_id;
RimeCommit commit;
RimeContext context;
std::string json_string;
RimeApi* rime = rime_get_api();

template <typename T>
inline const char* to_json(T& obj) {
  json_string = boost::json::serialize(obj);
  return json_string.c_str();
}

void handler(void*, RimeSessionId, const char* type, const char* value) {
  EM_ASM(onRimeNotification(UTF8ToString($0), UTF8ToString($1)), type, value);
}

bool start_rime(bool restart) {
  rime->initialize(&traits);
  rime->set_notification_handler(handler, NULL);
  if (restart ? rime->start_maintenance(true) : rime->start_quick()) {
    rime->join_maintenance_thread();
    return true;
  }
  return false;
}

bool stop_rime() {
  if (rime->destroy_session(session_id)) {
    rime->finalize();
    return true;
  }
  return false;
}

const char* process(Bool success) {
  boost::json::object result;
  result["success"] = !!success;
  rime->free_commit(&commit);
  if (rime->get_commit(session_id, &commit)) {
    result["committed"] = commit.text;
  }
  rime->free_context(&context);
  rime->get_context(session_id, &context);
  result["isComposing"] = !!context.composition.length;
  if (context.composition.length) {
    RimeComposition& composition = context.composition;
    std::string preedit = composition.preedit;
    boost::json::object pre_edit;
    pre_edit["before"] = preedit.substr(0, composition.sel_start);
    pre_edit["active"] = preedit.substr(
        composition.sel_start, composition.sel_end - composition.sel_start);
    pre_edit["after"] = preedit.substr(composition.sel_end);
    result["inputBuffer"] = pre_edit;
    RimeMenu& menu = context.menu;
    result["page"] = menu.page_no;
    result["isLastPage"] = !!menu.is_last_page;
    result["highlightedIndex"] = menu.highlighted_candidate_index;
    boost::json::array candidates;
    for (size_t i = 0; i < menu.num_candidates; ++i) {
      boost::json::object candidate;
      candidate["label"] = context.select_labels && context.select_labels[i] &&
                                   *context.select_labels[i]
                               ? context.select_labels[i]
                               : std::to_string((i + 1) % 10) + '.';
      candidate["text"] = menu.candidates[i].text;
      if (menu.candidates[i].comment) {
        candidate["comment"] = menu.candidates[i].comment;
      }
      candidates.push_back(candidate);
    }
    result["candidates"] = candidates;
  }
  return to_json(result);
}

extern "C" {

bool init() {
  RIME_STRUCT_INIT(RimeTraits, traits);
  traits.shared_data_dir = "/usr/share/rime-data";
  traits.user_data_dir = "/rime";
  traits.app_name = APP_NAME;
  rime->setup(&traits);
  RIME_STRUCT_INIT(RimeCommit, commit);
  RIME_STRUCT_INIT(RimeContext, context);
  if (start_rime(false)) {
    session_id = rime->create_session();
    rime->set_option(session_id, "soft_cursor", True);
    return true;
  }
  return false;
}

const char* process_key(const char* input) {
  return process(rime->simulate_key_sequence(session_id, input));
}

const char* select_candidate(int index) {
  return process(rime->select_candidate_on_current_page(session_id, index));
}

const char* delete_candidate(int index) {
  return process(rime->delete_candidate_on_current_page(session_id, index));
}

const char* flip_page(bool backward) {
  return process(rime->change_page(session_id, backward));
}

const char* clear_input() {
  rime->clear_composition(session_id);
  return process(True);
}

bool deploy() {
  if (stop_rime() && start_rime(true)) {
    session_id = rime->create_session();
    rime->set_option(session_id, "soft_cursor", True);
    return true;
  }
  return false;
}
}

}  // namespace rime_react
